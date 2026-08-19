import * as z from 'zod'
import { genreSchema, movieSchema } from '@/cognodb/schema'
import { runQuery } from '@/lib/db'
import { createTRPCRouter, publicProcedure } from '@/trpc/init'

const movieSummarySchema = movieSchema.extend({
  genres: z.array(z.string()),
})

const genreDetailSchema = genreSchema.extend({
  movies: z.array(movieSummarySchema),
})

const genreOverviewSchema = genreSchema.extend({
  movieCount: z.coerce.number().int().nonnegative(),
})

export const genresRouter = createTRPCRouter({
  list: publicProcedure.query(async function listGenres() {
    const rows = await runQuery(
      `
        MATCH (g:Genre)
        RETURN g.name AS name
        ORDER BY g.name
        `,
    )

    return genreSchema.array().parse(rows)
  }),

  overview: publicProcedure.query(async function genreOverview() {
    const rows = await runQuery(
      `
        MATCH (g:Genre)
        OPTIONAL MATCH (m:Movie)-[:IN_GENRE]->(g)
        WITH g, count(m) AS movieCount
        RETURN g.name AS name, movieCount
        ORDER BY movieCount DESC, g.name
        `,
    )

    return genreOverviewSchema.array().parse(rows)
  }),

  byName: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .query(async function genreByName({ input }) {
      const rows = await runQuery(
        `
        MATCH (g:Genre {name: $name})
        OPTIONAL MATCH (m:Movie)-[:IN_GENRE]->(g)
        OPTIONAL MATCH (m)-[:IN_GENRE]->(gg:Genre)
        WITH g, m, collect(DISTINCT gg.name) AS genres
        ORDER BY m.year DESC, m.title
        RETURN g.name AS name,
          collect(
            CASE WHEN m IS NULL THEN null ELSE m {
              .slug, .title, .year, .plot, .runtimeMin, .posterUrl,
              genres: genres
            } END
          ) AS movies
        `,
        { name: input.name },
      )

      const row = rows[0]
      if (!row) return null

      const movies = Array.isArray(row.movies) ? row.movies : []

      return genreDetailSchema.parse({
        name: row.name,
        movies: movies.filter((item) => item != null),
      })
    }),
})
