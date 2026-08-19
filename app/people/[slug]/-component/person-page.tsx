'use client'

import { skipToken } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { match, P } from 'ts-pattern'
import { CostarList, CostarListSkeleton } from './costar-list'
import { PersonHeader, PersonHeaderSkeleton } from './person-header'
import {
  MovieGrid,
  MovieGridSkeleton,
} from '@/components/movie-grid'
import { EntityNotFound } from '@/components/entity-not-found'
import { QueryError } from '@/components/query-error'
import { Section } from '@/components/section'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/trpc/client'

export function PersonPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <PersonHeaderSkeleton />
      <Separator />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-8">
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
        <aside className="md:sticky md:top-8 md:self-start">
          <Section title="Also starred with">
            <CostarListSkeleton />
          </Section>
        </aside>
      </div>
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
            <div
              className={
                person.actedIn.length > 0
                  ? 'grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_20rem]'
                  : undefined
              }
            >
              <div className="flex flex-col gap-8">
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
              {person.actedIn.length > 0 ? (
                <aside className="md:sticky md:top-8 md:self-start">
                  <Section title="Also starred with">
                    <CostarList slug={person.slug} />
                  </Section>
                </aside>
              ) : null}
            </div>
          </div>
        )),
    )
    .exhaustive()
}
