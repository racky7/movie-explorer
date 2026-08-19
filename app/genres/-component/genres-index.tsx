'use client'

import Link from 'next/link'
import { match } from 'ts-pattern'
import { QueryError } from '@/components/query-error'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'

export function GenresIndex() {
  const genresQuery = trpc.genres.overview.useQuery()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-medium">Genres</h1>
        <p className="text-sm text-muted-foreground">
          Every genre in the catalog, most-filmed first.
        </p>
      </div>
      {match(genresQuery)
        .with({ status: 'pending' }, () => <GenresGridSkeleton />)
        .with({ status: 'error' }, ({ error }) => (
          <QueryError
            error={error}
            onRetry={() => {
              void genresQuery.refetch()
            }}
          />
        ))
        .with({ status: 'success' }, ({ data: genres }) =>
          genres.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No genres to show yet. Run the seed script to load the catalog.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {genres.map((genre) => (
                <li key={genre.name}>
                  <Link
                    href={`/genres/${encodeURIComponent(genre.name)}`}
                    className="block h-full"
                  >
                    <Card className="h-full transition-colors hover:bg-muted/60">
                      <CardHeader>
                        <CardTitle className="text-lg leading-snug">
                          {genre.name}
                        </CardTitle>
                        <CardDescription>
                          {genre.movieCount}{' '}
                          {genre.movieCount === 1 ? 'film' : 'films'}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          ),
        )
        .exhaustive()}
    </div>
  )
}

function GenresGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      aria-label="Loading genres"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <Card className="h-full">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  )
}
