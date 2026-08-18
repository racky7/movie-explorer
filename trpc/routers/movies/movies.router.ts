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

const movieDetailSchema = movieSummarySchema.extend({
  cast: z.array(
    personSchema.extend({
      role: z
        .string()
        .nullish()
        .transform((role) => role || undefined),
    }),
  ),
  directors: z.array(personSchema),
  writers: z.array(personSchema),
})

const listInputSchema = z.object({
  q: z.string().min(1).optional(),
  year: z.number().int().optional(),
  genre: z.string().min(1).optional(),
  person: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(MAX_LIST_LIMIT).optional(),
  cursor: z.number().int().min(0).nullish(),
})

const movieListPageSchema = z.object({
  items: z.array(movieSummarySchema),
  nextCursor: z.number().int().nullable(),
})

export const moviesRouter = createTRPCRouter({
  list: publicProcedure
    .input(listInputSchema.optional())
    .query(async function listMovies({ input }) {
      const limit = input?.limit ?? DEFAULT_LIST_LIMIT
      const skip = input?.cursor ?? 0
      const rows = await runQuery(
        `
        MATCH (m:Movie)
        WHERE (
            $q IS NULL
            OR toLower(m.title) CONTAINS toLower($q)
            OR toLower(m.plot) CONTAINS toLower($q)
          )
          AND ($year IS NULL OR m.year = $year)
          AND ($genre IS NULL OR $genre IN [(m)-[:IN_GENRE]->(g:Genre) | g.name])
          AND (
            $person IS NULL OR ANY(
              actor IN [(p:Person)-[:ACTED_IN]->(m) | p]
              WHERE actor.slug = $person OR toLower(actor.name) CONTAINS toLower($person)
            )
          )
        WITH m
        ORDER BY m.year DESC, m.title
        SKIP $skip
        LIMIT $fetchLimit
        RETURN m {
          .slug, .title, .year, .plot, .runtimeMin, .posterUrl,
          genres: [(m)-[:IN_GENRE]->(g:Genre) | g.name]
        } AS movie
        `,
        {
          q: input?.q ?? null,
          year: input?.year == null ? null : neo4j.int(input.year),
          genre: input?.genre ?? null,
          person: input?.person ?? null,
          skip: neo4j.int(skip),
          fetchLimit: neo4j.int(limit + 1),
        },
      )

      return movieListPageSchema.parse({
        items: rows.slice(0, limit).map((row) => row.movie),
        nextCursor: rows.length > limit ? skip + limit : null,
      })
    }),

  years: publicProcedure.query(async function listMovieYears() {
    const rows = await runQuery(
      `
        MATCH (m:Movie)
        RETURN DISTINCT m.year AS year
        ORDER BY year DESC
        `,
    )

    return z.array(z.coerce.number().int()).parse(rows.map((row) => row.year))
  }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async function movieBySlug({ input }) {
      const rows = await runQuery(
        `
        MATCH (m:Movie {slug: $slug})
        RETURN m {
          .slug, .title, .year, .plot, .runtimeMin, .posterUrl,
          genres: [(m)-[:IN_GENRE]->(g:Genre) | g.name],
          cast: [(p:Person)-[r:ACTED_IN]->(m) | p {
            .slug, .name, .bornYear, .photoUrl, role: r.role
          }],
          directors: [(p:Person)-[:DIRECTED]->(m) | p {
            .slug, .name, .bornYear, .photoUrl
          }],
          writers: [(p:Person)-[:WROTE]->(m) | p {
            .slug, .name, .bornYear, .photoUrl
          }]
        } AS movie
        `,
        { slug: input.slug },
      )

      return movieDetailSchema.nullable().parse(rows[0]?.movie ?? null)
    }),

  related: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async function relatedMovies({ input }) {
      const rows = await runQuery(
        `
        MATCH (m:Movie {slug: $slug})-[:IN_GENRE]->(g:Genre)<-[:IN_GENRE]-(other:Movie)
        WHERE other.slug <> $slug
        WITH other, count(DISTINCT g) AS shared
        ORDER BY shared DESC, other.year DESC, other.title
        LIMIT 6
        RETURN other {
          .slug, .title, .year, .plot, .runtimeMin, .posterUrl,
          genres: [(other)-[:IN_GENRE]->(genre:Genre) | genre.name]
        } AS movie
        `,
        { slug: input.slug },
      )

      return movieSummarySchema.array().parse(rows.map((row) => row.movie))
    }),
})
