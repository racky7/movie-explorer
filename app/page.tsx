'use client'

import { useState } from 'react'
import { match } from 'ts-pattern'
import { MovieFilters, MovieFiltersSkeleton } from '@/app/-component/movie-filters'
import { MovieGrid, MovieGridSkeleton } from '@/app/movies/[slug]/-component/movie-grid'
import { QueryError } from '@/components/shared/query-error'
import { Button } from '@/components/ui/button'
import { trpc } from '@/trpc/client'

const PAGE_SIZE = 20

type CatalogFilters = {
  q?: string
  year?: number
  genre?: string
  person?: string
}

export default function Home() {
  const [filters, setFilters] = useState<CatalogFilters>({})
  const [page, setPage] = useState(1)

  const moviesQuery = trpc.movies.list.useQuery(
    {
      ...filters,
      limit: PAGE_SIZE,
      cursor: page > 1 ? (page - 1) * PAGE_SIZE : undefined,
    },
  )
  const genresQuery = trpc.genres.list.useQuery()
  const peopleQuery = trpc.people.list.useQuery()
  const yearsQuery = trpc.movies.years.useQuery()

  const filtersPending =
    genresQuery.isPending && peopleQuery.isPending && yearsQuery.isPending

  return (
    <div className="flex flex-col gap-6">
      {filtersPending ? (
        <MovieFiltersSkeleton />
      ) : (
        <MovieFilters
          genres={(genresQuery.data ?? []).map((item) => item.name)}
          people={peopleQuery.data ?? []}
          years={yearsQuery.data ?? []}
          values={filters}
          onChange={(next) => {
            setFilters(next)
            setPage(1)
          }}
        />
      )}
      {match(moviesQuery)
        .with({ status: 'pending' }, () => <MovieGridSkeleton count={6} />)
        .with({ status: 'error' }, ({ error }) => (
          <QueryError
            error={error}
            onRetry={() => {
              void moviesQuery.refetch()
              void genresQuery.refetch()
              void peopleQuery.refetch()
              void yearsQuery.refetch()
            }}
          />
        ))
        .with({ status: 'success' }, ({ data: moviesPage }) => {
          const { items: movies, nextCursor } = moviesPage

          return (
            <>
              <MovieGrid movies={movies} />
              {(page > 1 || nextCursor != null) && (
                <nav className="flex items-center justify-between">
                  {page > 1 ? (
                    <Button
                      variant="outline"
                      onClick={() => setPage((current) => current - 1)}
                    >
                      Previous
                    </Button>
                  ) : (
                    <span />
                  )}
                  {nextCursor != null ? (
                    <Button
                      variant="outline"
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </Button>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </>
          )
        })
        .exhaustive()}
    </div>
  )
}
