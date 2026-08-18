import Link from 'next/link'
import { MovieFilters } from '@/app/movies/[slug]/-component/movie-filters'
import { MovieGrid } from '@/app/movies/[slug]/-component/movie-grid'
import { buttonVariants } from '@/components/ui/button'
import { caller } from '@/trpc/server'

const PAGE_SIZE = 20

function firstParam(value: string | string[] | undefined) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function catalogHref(values: {
  q?: string
  year?: number
  genre?: string
  person?: string
  page?: number
}) {
  const params = new URLSearchParams()
  if (values.q) params.set('q', values.q)
  if (values.year != null) params.set('year', String(values.year))
  if (values.genre) params.set('genre', values.genre)
  if (values.person) params.set('person', values.person)
  if (values.page != null && values.page > 1) {
    params.set('page', String(values.page))
  }
  const query = params.toString()
  return query ? `/?${query}` : '/'
}

export default async function Home({ searchParams }: PageProps<'/'>) {
  const params = await searchParams
  const q = firstParam(params.q)
  const yearRaw = firstParam(params.year)
  const year =
    yearRaw && /^\d{4}$/.test(yearRaw)
      ? Number.parseInt(yearRaw, 10)
      : undefined
  const genre = firstParam(params.genre)
  const person = firstParam(params.person)
  const pageRaw = firstParam(params.page)
  const page =
    pageRaw && /^\d+$/.test(pageRaw)
      ? Math.max(1, Number.parseInt(pageRaw, 10))
      : 1

  const [{ items: movies, nextCursor }, genres, people, years] =
    await Promise.all([
      caller.movies.list({
        q,
        year,
        genre,
        person,
        limit: PAGE_SIZE,
        cursor: page > 1 ? (page - 1) * PAGE_SIZE : undefined,
      }),
      caller.genres.list(),
      caller.people.list(),
      caller.movies.years(),
    ])

  const filters = { q, year, genre, person }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-medium">Movies</h1>
        <p className="text-sm text-muted-foreground">
          Search and filter the catalog
        </p>
      </div>
      <MovieFilters
        genres={genres.map((item) => item.name)}
        people={people}
        years={years}
        values={filters}
      />
      <MovieGrid movies={movies} />
      {(page > 1 || nextCursor != null) && (
        <nav className="flex items-center justify-between">
          {page > 1 ? (
            <Link
              className={buttonVariants({ variant: 'outline' })}
              href={catalogHref({ ...filters, page: page - 1 })}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          {nextCursor != null ? (
            <Link
              className={buttonVariants({ variant: 'outline' })}
              href={catalogHref({ ...filters, page: page + 1 })}
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}
