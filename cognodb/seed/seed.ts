/**
 * Seed CognoDB from cognodb/seed/movie-data/*.json.
 * Run with: bun run db:seed
 * Wipe existing Movie/Person/Genre subgraph first: bun run db:seed -- --reset
 *
 * Reads COGNODB_* from .env (Bun loads it automatically).
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import neo4j, { type Integer } from 'neo4j-driver'
import * as z from 'zod'
import { constraintStatements } from '../schema'
import { checkDatabaseHealth, cognodb, runQuery, runWrite } from '@/lib/db'

const seedDir = join(import.meta.dirname, 'movie-data')
const reset = process.argv.includes('--reset')

const seedMovieSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  year: z.number().int(),
  plot: z.string(),
  runtime_min: z.number().int().positive(),
  poster_url: z.string(),
})

const seedPersonSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  born_year: z.number().int().nullable(),
  photo_url: z.string(),
})

const seedGenreSchema = z.object({
  name: z.string().min(1),
})

const seedActedInSchema = z.object({
  movie_slug: z.string().min(1),
  person_slug: z.string().min(1),
  role: z.string().min(1),
})

const seedCreditSchema = z.object({
  movie_slug: z.string().min(1),
  person_slug: z.string().min(1),
})

const seedInGenreSchema = z.object({
  movie_slug: z.string().min(1),
  genre_name: z.string().min(1),
})

async function loadJson(name: string): Promise<unknown> {
  const raw = await readFile(join(seedDir, name), 'utf8')
  return JSON.parse(raw)
}

function int(value: number): Integer {
  return neo4j.int(value)
}

async function seed() {
  if (reset) {
    console.log('Resetting Movie, Person, and Genre nodes…')
    await runWrite(
      `
      MATCH (n)
      WHERE n:Movie OR n:Person OR n:Genre
      DETACH DELETE n
      `,
    )
  }

  console.log('Applying uniqueness constraints…')
  for (const statement of constraintStatements) {
    await runWrite(statement)
  }

  const movies = z.array(seedMovieSchema).parse(await loadJson('movie.json'))
  const people = z.array(seedPersonSchema).parse(await loadJson('person.json'))
  const genres = z.array(seedGenreSchema).parse(await loadJson('genre.json'))
  const actedIn = z
    .array(seedActedInSchema)
    .parse(await loadJson('acted_in.json'))
  const directed = z
    .array(seedCreditSchema)
    .parse(await loadJson('directed.json'))
  const wrote = z.array(seedCreditSchema).parse(await loadJson('wrote.json'))
  const inGenre = z
    .array(seedInGenreSchema)
    .parse(await loadJson('in_genre.json'))

  console.log(
    `Loaded ${movies.length} movies, ${people.length} people, ${genres.length} genres`,
  )

  await runWrite(
    `
    UNWIND $rows AS row
    MERGE (m:Movie {slug: row.slug})
    SET m.title = row.title,
        m.year = row.year,
        m.plot = row.plot,
        m.runtimeMin = row.runtimeMin,
        m.posterUrl = row.posterUrl
    `,
    {
      rows: movies.map((movie) => ({
        slug: movie.slug,
        title: movie.title,
        year: int(movie.year),
        plot: movie.plot,
        runtimeMin: int(movie.runtime_min),
        posterUrl: movie.poster_url,
      })),
    },
  )

  await runWrite(
    `
    UNWIND $rows AS row
    MERGE (p:Person {slug: row.slug})
    SET p.name = row.name,
        p.bornYear = row.bornYear,
        p.photoUrl = row.photoUrl
    `,
    {
      rows: people.map((person) => ({
        slug: person.slug,
        name: person.name,
        bornYear: person.born_year == null ? null : int(person.born_year),
        photoUrl: person.photo_url,
      })),
    },
  )

  await runWrite(
    `
    UNWIND $rows AS row
    MERGE (g:Genre {name: row.name})
    `,
    { rows: genres },
  )

  await runWrite(
    `
    UNWIND $rows AS row
    MATCH (person:Person {slug: row.personSlug})
    MATCH (movie:Movie {slug: row.movieSlug})
    MERGE (person)-[rel:ACTED_IN]->(movie)
    SET rel.role = row.role
    `,
    {
      rows: actedIn.map((row) => ({
        movieSlug: row.movie_slug,
        personSlug: row.person_slug,
        role: row.role,
      })),
    },
  )

  await runWrite(
    `
    UNWIND $rows AS row
    MATCH (person:Person {slug: row.personSlug})
    MATCH (movie:Movie {slug: row.movieSlug})
    MERGE (person)-[:DIRECTED]->(movie)
    `,
    {
      rows: directed.map((row) => ({
        movieSlug: row.movie_slug,
        personSlug: row.person_slug,
      })),
    },
  )

  await runWrite(
    `
    UNWIND $rows AS row
    MATCH (person:Person {slug: row.personSlug})
    MATCH (movie:Movie {slug: row.movieSlug})
    MERGE (person)-[:WROTE]->(movie)
    `,
    {
      rows: wrote.map((row) => ({
        movieSlug: row.movie_slug,
        personSlug: row.person_slug,
      })),
    },
  )

  await runWrite(
    `
    UNWIND $rows AS row
    MATCH (movie:Movie {slug: row.movieSlug})
    MATCH (genre:Genre {name: row.genreName})
    MERGE (movie)-[:IN_GENRE]->(genre)
    `,
    {
      rows: inGenre.map((row) => ({
        movieSlug: row.movie_slug,
        genreName: row.genre_name,
      })),
    },
  )

  const nodeCounts = await runQuery(`
    MATCH (n)
    WHERE n:Movie OR n:Person OR n:Genre
    RETURN labels(n)[0] AS label, count(*) AS count
    ORDER BY label
  `)
  const relCounts = await runQuery(`
    MATCH ()-[r]->()
    WHERE type(r) IN ['ACTED_IN', 'DIRECTED', 'WROTE', 'IN_GENRE']
    RETURN type(r) AS type, count(*) AS count
    ORDER BY type
  `)

  console.log('Seed complete:')
  for (const row of nodeCounts) {
    console.log(`  ${String(row.label)}: ${String(row.count)}`)
  }
  for (const row of relCounts) {
    console.log(`  ${String(row.type)}: ${String(row.count)}`)
  }
}

try {
  const health = await checkDatabaseHealth()
  if (health.status !== 'ok') {
    console.error('CognoDB seed failed:', health.message)
    process.exitCode = 1
  } else {
    await seed()
  }
} catch (error) {
  console.error(
    'CognoDB seed failed:',
    error instanceof Error ? error.message : error,
  )
  process.exitCode = 1
} finally {
  await cognodb.close()
}
