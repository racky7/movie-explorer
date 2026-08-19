import neo4j from 'neo4j-driver'
import * as z from 'zod'
import { movieSchema, personSchema } from '@/cognodb/schema'
import { runQuery } from '@/lib/db'
import { createTRPCRouter, publicProcedure } from '@/trpc/init'

const DEFAULT_LIST_LIMIT = 20
const MAX_LIST_LIMIT = 100

const movieSummarySchema = movieSchema.extend({
  genres: z.array(z.string()),
})

const personDetailSchema = personSchema.extend({
  actedIn: z.array(movieSummarySchema),
  directed: z.array(movieSummarySchema),
  wrote: z.array(movieSummarySchema),
})

export const peopleRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ q: z.string().min(1).optional() }).optional())
    .query(async function listPeople({ input }) {
      const rows = await runQuery(
        `
        MATCH (p:Person)-[:ACTED_IN]->(:Movie)
        WHERE $q IS NULL OR toLower(p.name) CONTAINS toLower($q)
        RETURN DISTINCT p { .slug, .name, .bornYear, .photoUrl } AS person
        ORDER BY person.name
        `,
        { q: input?.q ?? null },
      )

      return personSchema.array().parse(rows.map((row) => row.person))
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async function personBySlug({ input }) {
      const personRows = await runQuery(
        `
        MATCH (p:Person {slug: $slug})
        RETURN p { .slug, .name, .bornYear, .photoUrl } AS person
        `,
        { slug: input.slug },
      )

      const person = personRows[0]?.person
      if (!person) return null

      const creditRows = await runQuery(
        `
        MATCH (p:Person {slug: $slug})-[rel:ACTED_IN|DIRECTED|WROTE]->(m:Movie)
        OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
        WITH type(rel) AS relType, m, collect(g.name) AS genres
        ORDER BY m.year DESC, m.title
        RETURN relType, m {
          .slug, .title, .year, .plot, .runtimeMin, .posterUrl,
          genres: genres
        } AS movie
        `,
        { slug: input.slug },
      )

      const actedIn: z.infer<typeof movieSummarySchema>[] = []
      const directed: z.infer<typeof movieSummarySchema>[] = []
      const wrote: z.infer<typeof movieSummarySchema>[] = []

      for (const row of creditRows) {
        const summary = movieSummarySchema.parse(row.movie)
        if (row.relType === 'ACTED_IN') actedIn.push(summary)
        else if (row.relType === 'DIRECTED') directed.push(summary)
        else if (row.relType === 'WROTE') wrote.push(summary)
      }

      return personDetailSchema.parse({
        ...personSchema.parse(person),
        actedIn,
        directed,
        wrote,
      })
    }),

  costars: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        limit: z.number().int().min(1).max(MAX_LIST_LIMIT).optional(),
        cursor: z.number().int().min(0).nullish(),
      }),
    )
    .query(async function personCostars({ input }) {
      const limit = input.limit ?? DEFAULT_LIST_LIMIT
      const skip = input.cursor ?? 0

      const personRows = await runQuery(
        `
        MATCH (p:Person {slug: $slug})
        RETURN p.slug AS slug
        `,
        { slug: input.slug },
      )
      if (!personRows[0]) return null

      const rows = await runQuery(
        `
        MATCH (a:Person {slug: $slug})-[:ACTED_IN]->(m:Movie)<-[:ACTED_IN]-(other:Person)
        WHERE other.slug <> $slug
        WITH other, m
        ORDER BY m.year DESC, m.title
        WITH other, collect(DISTINCT m {
          .slug, .title, .year, .plot, .runtimeMin, .posterUrl
        }) AS movies
        ORDER BY size(movies) DESC, other.name
        SKIP $skip
        LIMIT $fetchLimit
        RETURN other { .slug, .name, .bornYear, .photoUrl } AS person, movies
        `,
        {
          slug: input.slug,
          skip: neo4j.int(skip),
          fetchLimit: neo4j.int(limit + 1),
        },
      )

      return z
        .object({
          items: z.array(
            z.object({
              person: personSchema,
              movies: z.array(movieSchema),
            }),
          ),
          nextCursor: z.number().int().nullable(),
        })
        .parse({
          items: rows.slice(0, limit).map((row) => ({
            person: row.person,
            movies: row.movies,
          })),
          nextCursor: rows.length > limit ? skip + limit : null,
        })
    }),
})
