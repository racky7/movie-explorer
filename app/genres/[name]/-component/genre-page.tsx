'use client'

import { skipToken } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { match, P } from 'ts-pattern'
import {
  MovieGrid,
  MovieGridSkeleton,
} from '@/app/movies/[slug]/-component/movie-grid'
import { EntityNotFound } from '@/components/shared/entity-not-found'
import { QueryError } from '@/components/shared/query-error'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'

export function GenrePageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-36" />
      </div>
      <MovieGridSkeleton />
    </div>
  )
}

export function GenrePage() {
  const params = useParams<{ name: string }>()
  const name = params.name ? decodeURIComponent(params.name) : undefined
  const genreQuery = trpc.genres.byName.useQuery(name ? { name } : skipToken)

  return match(genreQuery)
    .with({ status: 'pending' }, () => <GenrePageSkeleton />)
    .with({ status: 'error' }, ({ error }) => (
      <QueryError
        error={error}
        onRetry={() => {
          void genreQuery.refetch()
        }}
      />
    ))
    .with({ status: 'success' }, ({ data }) =>
      match(data)
        .with(P.nullish, () => (
          <EntityNotFound message="That genre is not in the catalog." />
        ))
        .otherwise((genre) => (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="font-heading text-3xl font-medium">
                {genre.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Movies in this genre
              </p>
            </div>
            <MovieGrid movies={genre.movies} />
          </div>
        )),
    )
    .exhaustive()
}
