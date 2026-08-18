import * as z from 'zod'

export const NodeLabel = {
  Movie: 'Movie',
  Person: 'Person',
  Genre: 'Genre',
} as const

export const RelType = {
  ACTED_IN: 'ACTED_IN',
  DIRECTED: 'DIRECTED',
  WROTE: 'WROTE',
  IN_GENRE: 'IN_GENRE',
} as const

export type NodeLabel = (typeof NodeLabel)[keyof typeof NodeLabel]
export type RelType = (typeof RelType)[keyof typeof RelType]

export const movieSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  year: z.coerce.number().int(),
  plot: z.string(),
  runtimeMin: z.coerce.number().int().positive(),
  posterUrl: z.string(),
})

export const personSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  bornYear: z.coerce.number().int().nullish(),
  photoUrl: z.string(),
})

export const genreSchema = z.object({
  name: z.string().min(1),
})

export const actedInSchema = z.object({
  role: z.string().min(1).optional(),
})

export const directedSchema = z.object({})
export const wroteSchema = z.object({})
export const inGenreSchema = z.object({})

export type Movie = z.infer<typeof movieSchema>
export type Person = z.infer<typeof personSchema>
export type Genre = z.infer<typeof genreSchema>
export type ActedIn = z.infer<typeof actedInSchema>
export type Directed = z.infer<typeof directedSchema>
export type Wrote = z.infer<typeof wroteSchema>
export type InGenre = z.infer<typeof inGenreSchema>

export const CREDIT_REL_TYPES = [
  RelType.ACTED_IN,
  RelType.DIRECTED,
  RelType.WROTE,
] as const

export const constraintStatements = [
  'CREATE CONSTRAINT movie_slug IF NOT EXISTS FOR (m:Movie) REQUIRE m.slug IS UNIQUE',
  'CREATE CONSTRAINT person_slug IF NOT EXISTS FOR (p:Person) REQUIRE p.slug IS UNIQUE',
  'CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE',
] as const
