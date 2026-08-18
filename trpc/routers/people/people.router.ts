import * as z from 'zod'
import { movieSchema, personSchema } from '@/cognodb/schema'
import { runQuery } from '@/lib/db'
import { createTRPCRouter, publicProcedure } from '@/trpc/init'

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
        MATCH (p:Person)
        WHERE $q IS NULL OR toLower(p.name) CONTAINS toLower($q)
        RETURN p { .slug, .name, .bornYear, .photoUrl } AS person
        ORDER BY p.name
        LIMIT 50
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
})
