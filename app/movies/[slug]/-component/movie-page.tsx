'use client'

import { skipToken } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { match, P } from 'ts-pattern'
import {
  CreditNames,
  CreditNamesSkeleton,
  CreditRow,
  CreditRowSkeleton,
} from './credit-row'
import { MovieGrid, MovieGridSkeleton } from '@/components/movie-grid'
import { MovieHero, MovieHeroSkeleton } from './movie-hero'
import { EntityNotFound } from '@/components/entity-not-found'
import { QueryError } from '@/components/query-error'
import { Section } from '@/components/section'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/trpc/client'

export function MoviePage() {
  const { slug } = useParams<{ slug: string }>()
  const movieQuery = trpc.movies.bySlug.useQuery(slug ? { slug } : skipToken)
  const relatedQuery = trpc.movies.related.useQuery(slug ? { slug } : skipToken)

  return match({ movie: movieQuery, related: relatedQuery })
    .with(
      P.union(
        { movie: { status: 'pending' } },
        { related: { status: 'pending' } },
      ),
      () => <MoviePageSkeleton />,
    )
    .with(
      P.union(
        { movie: { status: 'error', error: P.select() } },
        { related: { status: 'error', error: P.select() } },
      ),
      (error) => (
        <QueryError
          error={error}
          onRetry={() => {
            void movieQuery.refetch()
            void relatedQuery.refetch()
          }}
        />
      ),
    )
    .with(
      { movie: { status: 'success' }, related: { status: 'success' } },
      ({ movie: { data: movie }, related: { data: related } }) =>
        match(movie)
          .with(P.nullish, () => (
            <EntityNotFound message="That movie is not in the catalog." />
          ))
          .otherwise((movie) => (
            <div className="flex flex-col gap-8">
              <MovieHero movie={movie} />
              <Separator />
              <Section title="Cast">
                <CreditRow people={movie.cast} />
              </Section>
              <Separator />
              <CreditNames title="Directors" people={movie.directors} />
              <Separator />
              <CreditNames title="Writers" people={movie.writers} />
              <Section title="More like this">
                <MovieGrid movies={related} />
              </Section>
            </div>
          )),
    )
    .exhaustive()
}

export function MoviePageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <MovieHeroSkeleton />
      <Separator />
      <Section title="Cast">
        <CreditRowSkeleton />
      </Section>
      <Separator />
      <CreditNamesSkeleton title="Directors" />
      <Separator />
      <CreditNamesSkeleton title="Writers" />
      <Section title="More like this">
        <MovieGridSkeleton />
      </Section>
    </div>
  )
}