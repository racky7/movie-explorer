'use client'

import { skipToken } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { match, P } from 'ts-pattern'
import { PersonHeader, PersonHeaderSkeleton } from './person-header'
import {
  MovieGrid,
  MovieGridSkeleton,
} from '@/app/movies/[slug]/-component/movie-grid'
import { EntityNotFound } from '@/components/shared/entity-not-found'
import { QueryError } from '@/components/shared/query-error'
import { Section } from '@/components/shared/section'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/trpc/client'

export function PersonPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <PersonHeaderSkeleton />
      <Separator />
      <Section title="Acted in">
        <MovieGridSkeleton />
      </Section>
      <Section title="Directed">
        <MovieGridSkeleton count={3} />
      </Section>
      <Section title="Wrote">
        <MovieGridSkeleton count={3} />
      </Section>
    </div>
  )
}

export function PersonPage() {
  const { slug } = useParams<{ slug: string }>()
  const personQuery = trpc.people.bySlug.useQuery(slug ? { slug } : skipToken)

  return match(personQuery)
    .with({ status: 'pending' }, () => <PersonPageSkeleton />)
    .with({ status: 'error' }, ({ error }) => (
      <QueryError
        error={error}
        onRetry={() => {
          void personQuery.refetch()
        }}
      />
    ))
    .with({ status: 'success' }, ({ data }) =>
      match(data)
        .with(P.nullish, () => (
          <EntityNotFound message="That person is not in the catalog." />
        ))
        .otherwise((person) => (
          <div className="flex flex-col gap-8">
            <PersonHeader person={person} />
            <Separator />
            <Section title="Acted in">
              <MovieGrid movies={person.actedIn} />
            </Section>
            <Section title="Directed">
              <MovieGrid movies={person.directed} />
            </Section>
            <Section title="Wrote">
              <MovieGrid movies={person.wrote} />
            </Section>
          </div>
        )),
    )
    .exhaustive()
}
