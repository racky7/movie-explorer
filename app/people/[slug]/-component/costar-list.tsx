'use client'

import Link from 'next/link'
import { match } from 'ts-pattern'
import type { Movie, Person } from '@/cognodb/schema'
import { QueryError } from '@/components/shared/query-error'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'

const PAGE_SIZE = 12

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function CostarRow({
  person,
  movies,
}: {
  person: Person
  movies: Movie[]
}) {
  return (
    <li className="flex items-start gap-3">
      <Link href={`/people/${person.slug}`} className="shrink-0">
        <Avatar className="size-12">
          <AvatarFallback>{initials(person.name)}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex min-w-0 flex-col gap-1 pt-1">
        <Link
          href={`/people/${person.slug}`}
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          {person.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {movies.map((movie, index) => (
            <span key={movie.slug}>
              {index > 0 ? ', ' : null}
              <Link
                href={`/movies/${movie.slug}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {movie.title} ({movie.year})
              </Link>
            </span>
          ))}
        </p>
      </div>
    </li>
  )
}

export function CostarListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul
      className="flex flex-col gap-4"
      aria-label="Loading co-stars"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex items-start gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2 pt-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function CostarList({ slug }: { slug: string }) {
  const costarsQuery = trpc.people.costars.useInfiniteQuery(
    { slug, limit: PAGE_SIZE },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    },
  )

  return match(costarsQuery)
    .with({ status: 'pending' }, () => <CostarListSkeleton />)
    .with({ status: 'error' }, ({ error }) => (
      <QueryError
        error={error}
        onRetry={() => {
          void costarsQuery.refetch()
        }}
      />
    ))
    .with({ status: 'success' }, ({ data }) => {
      const items = data.pages.flatMap((page) => page?.items ?? [])

      if (items.length === 0) {
        return (
          <p className="text-sm text-muted-foreground">
            No co-stars in the catalog yet.
          </p>
        )
      }

      return (
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <CostarRow
                key={item.person.slug}
                person={item.person}
                movies={item.movies}
              />
            ))}
          </ul>
          {costarsQuery.hasNextPage ? (
            <Button
              variant="outline"
              disabled={costarsQuery.isFetchingNextPage}
              onClick={() => {
                void costarsQuery.fetchNextPage()
              }}
            >
              {costarsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
            </Button>
          ) : null}
        </div>
      )
    })
    .exhaustive()
}
