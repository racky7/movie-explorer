import neo4j from 'neo4j-driver'
import * as z from 'zod'
import { movieSchema, personSchema } from '@/cognodb/schema'
import { runQuery } from '@/lib/db'
import { createTRPCRouter, publicProcedure } from '@/trpc/init'
import { connectionResultSchema, hopsFromPath } from './people.lib'

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
    .input(
      z
        .object({
          q: z.string().min(1).optional(),
          limit: z.number().int().min(1).max(MAX_LIST_LIMIT).optional(),
        })
        .optional(),
    )
    .query(async function listPeople({ input }) {
      const q = input?.q ?? null
      const limit = input?.limit ?? (q ? DEFAULT_LIST_LIMIT : null)
      const rows = await runQuery(
        limit == null
          ? `
            MATCH (p:Person)
            WHERE $q IS NULL OR toLower(p.name) CONTAINS toLower($q)
            RETURN p { .slug, .name, .bornYear, .photoUrl } AS person
            ORDER BY person.name
            `
          : `
            MATCH (p:Person)
            WHERE $q IS NULL OR toLower(p.name) CONTAINS toLower($q)
            RETURN p { .slug, .name, .bornYear, .photoUrl } AS person
            ORDER BY person.name
            LIMIT $fetchLimit
            `,
        limit == null ? { q } : { q, fetchLimit: neo4j.int(limit) },
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

  randomPair: publicProcedure
    .input(
      z
        .object({
          excludeFromSlug: z.string().min(1).nullish(),
          excludeToSlug: z.string().min(1).nullish(),
          anchorSlug: z.string().min(1).nullish(),
        })
        .optional(),
    )
    .mutation(async function randomConnectedPair({ input }) {
      const excludeFromSlug = input?.excludeFromSlug ?? null
      const excludeToSlug = input?.excludeToSlug ?? null
      const anchorSlug = input?.anchorSlug ?? null
      const pairSchema = z.object({ from: personSchema, to: personSchema })
      const maxAttempts = 8

      if (anchorSlug) {
        const rows = await runQuery(
          `
          MATCH (from:Person {slug: $anchorSlug})
          MATCH path = shortestPath(
            (from)-[:ACTED_IN|DIRECTED|WROTE*1..12]-(to:Person)
          )
          WHERE from <> to
          WITH from, to
          ORDER BY rand()
          LIMIT 1
          RETURN
            from { .slug, .name, .bornYear, .photoUrl } AS from,
            to { .slug, .name, .bornYear, .photoUrl } AS to
          `,
          { anchorSlug },
        )

        const pair = rows[0]
        if (!pair) return null

        return pairSchema.parse({ from: pair.from, to: pair.to })
      }

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const rows = await runQuery(
          `
          MATCH (from:Person)-[:ACTED_IN|DIRECTED|WROTE]->(:Movie)
                <-[:ACTED_IN|DIRECTED|WROTE]-(other:Person)
          WHERE from <> other
          WITH DISTINCT from
          ORDER BY rand()
          LIMIT 1

          MATCH path = shortestPath(
            (from)-[:ACTED_IN|DIRECTED|WROTE*1..12]-(to:Person)
          )
          WHERE from <> to
            AND NOT (
              $excludeFromSlug IS NOT NULL
              AND $excludeToSlug IS NOT NULL
              AND (
                (from.slug = $excludeFromSlug AND to.slug = $excludeToSlug)
                OR (from.slug = $excludeToSlug AND to.slug = $excludeFromSlug)
              )
            )
          WITH from, to
          ORDER BY rand()
          LIMIT 1
          RETURN
            from { .slug, .name, .bornYear, .photoUrl } AS from,
            to { .slug, .name, .bornYear, .photoUrl } AS to
          `,
          { excludeFromSlug, excludeToSlug },
        )

        const pair = rows[0]
        if (!pair) continue

        return pairSchema.parse({ from: pair.from, to: pair.to })
      }

      return null
    }),

  connection: publicProcedure
    .input(
      z.object({
        fromSlug: z.string().min(1),
        toSlug: z.string().min(1),
      }),
    )
    .mutation(async function personConnection({ input }) {
      const peopleRows = await runQuery(
        `
        MATCH (from:Person {slug: $fromSlug})
        MATCH (to:Person {slug: $toSlug})
        RETURN from { .slug, .name, .bornYear, .photoUrl } AS from,
               to { .slug, .name, .bornYear, .photoUrl } AS to
        `,
        { fromSlug: input.fromSlug, toSlug: input.toSlug },
      )

      const endpoints = peopleRows[0]
      if (!endpoints) return null

      const from = personSchema.parse(endpoints.from)
      const to = personSchema.parse(endpoints.to)

      if (input.fromSlug === input.toSlug) {
        return connectionResultSchema.parse({
          from,
          to,
          degrees: 0,
          hops: [],
        })
      }

      const pathRows = await runQuery(
        `
        MATCH (from:Person {slug: $fromSlug}), (to:Person {slug: $toSlug})
        MATCH path = shortestPath(
          (from)-[:ACTED_IN|DIRECTED|WROTE*1..12]-(to)
        )
        RETURN
          [n IN nodes(path) | CASE
            WHEN n:Person THEN n {
              kind: 'person', .slug, .name, .bornYear, .photoUrl
            }
            WHEN n:Movie THEN n {
              kind: 'movie', .slug, .title, .year, .plot, .runtimeMin, .posterUrl
            }
          END] AS nodes,
          [r IN relationships(path) | { type: type(r), role: r.role }] AS rels
        `,
        { fromSlug: input.fromSlug, toSlug: input.toSlug },
      )

      const path = pathRows[0]
      if (!path) {
        return connectionResultSchema.parse({
          from,
          to,
          degrees: null,
          hops: [],
        })
      }

      const hops = hopsFromPath(path.nodes, path.rels)
      return connectionResultSchema.parse({
        from,
        to,
        degrees: hops.length > 0 ? hops.length : null,
        hops,
      })
    }),
})
