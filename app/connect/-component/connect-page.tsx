'use client'

import { ArrowsLeftRightIcon, ShuffleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { match } from 'ts-pattern'
import { ConnectionPath, ConnectionPathSkeleton } from './connection-path'
import { PersonSearch, PersonSearchSkeleton } from './person-search'
import type { Person } from '@/cognodb/schema'
import { QueryError } from '@/components/shared/query-error'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'

function readSlug(params: URLSearchParams, key: string) {
  const value = params.get(key)?.trim()
  return value ? value : null
}

export function ConnectPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromSlug = readSlug(searchParams, 'from')
  const toSlug = readSlug(searchParams, 'to')
  const [fromPerson, setFromPerson] = useState<Person | null>(null)
  const [toPerson, setToPerson] = useState<Person | null>(null)

  const connection = trpc.people.connection.useMutation()
  const randomPair = trpc.people.randomPair.useMutation()
  const { mutate, reset } = connection
  const [noPair, setNoPair] = useState(false)
  const isBusy = randomPair.isPending || connection.isPending

  function replaceSlugs(from: string | null, to: string | null) {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function syncConnection(nextFrom: string | null, nextTo: string | null) {
    replaceSlugs(nextFrom, nextTo)
    setNoPair(false)
    randomPair.reset()
    if (nextFrom && nextTo) {
      mutate({ fromSlug: nextFrom, toSlug: nextTo })
      return
    }
    reset()
  }

  async function pickRandomPair() {
    setNoPair(false)
    const keepFrom = Boolean(fromSlug && !toSlug)
    const keepTo = Boolean(toSlug && !fromSlug)
    const anchorSlug = keepFrom ? fromSlug : keepTo ? toSlug : null
    try {
      const pair = await randomPair.mutateAsync(
        anchorSlug
          ? { anchorSlug }
          : {
              excludeFromSlug: fromSlug,
              excludeToSlug: toSlug,
            },
      )
      if (!pair) {
        setNoPair(true)
        return
      }
      if (keepFrom) {
        setToPerson(pair.to)
        syncConnection(fromSlug, pair.to.slug)
        return
      }
      if (keepTo) {
        setFromPerson(pair.to)
        syncConnection(pair.to.slug, toSlug)
        return
      }
      setFromPerson(pair.from)
      setToPerson(pair.to)
      syncConnection(pair.from.slug, pair.to.slug)
    } catch {
      // Surfaced via randomPair.isError
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-medium">Connections</h1>
        <p className="text-sm text-muted-foreground">
          Search two people to see how they connect through films.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <PersonSearch
          label="Person A"
          slug={fromSlug}
          person={fromPerson}
          onPersonChange={(person) => {
            setFromPerson(person)
            syncConnection(person?.slug ?? null, toPerson?.slug ?? toSlug)
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Swap people"
          disabled={isBusy || (!fromSlug && !toSlug)}
          onClick={() => {
            setFromPerson(toPerson)
            setToPerson(fromPerson)
            syncConnection(toSlug, fromSlug)
          }}
        >
          <ArrowsLeftRightIcon />
        </Button>
        <PersonSearch
          label="Person B"
          slug={toSlug}
          person={toPerson}
          onPersonChange={(person) => {
            setToPerson(person)
            syncConnection(fromPerson?.slug ?? fromSlug, person?.slug ?? null)
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={isBusy}
          onClick={() => {
            void pickRandomPair()
          }}
        >
          <ShuffleIcon data-icon="inline-start" />
          Random pair
        </Button>
      </div>

      {randomPair.isPending ? (
        <ConnectionPathSkeleton />
      ) : randomPair.isError ? (
        <QueryError
          error={randomPair.error}
          onRetry={() => void pickRandomPair()}
        />
      ) : noPair ? (
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t find a connected pair in this catalog.
        </p>
      ) : fromSlug && toSlug ? (
        match(connection)
          .with({ status: 'idle' }, () => (
            <Button
              type="button"
              onClick={() => {
                mutate({ fromSlug, toSlug })
              }}
            >
              Find connection
            </Button>
          ))
          .with({ status: 'pending' }, () => <ConnectionPathSkeleton />)
          .with({ status: 'error' }, ({ error }) => (
            <QueryError
              error={error}
              onRetry={() => {
                if (!fromSlug || !toSlug) return
                mutate({ fromSlug, toSlug })
              }}
            />
          ))
          .with({ status: 'success' }, ({ data }) =>
            data == null ? (
              <p className="text-sm text-muted-foreground">
                One of those people is not in the catalog.
              </p>
            ) : (
              <ConnectionPath result={data} />
            ),
          )
          .exhaustive()
      ) : fromSlug || toSlug ? (
        <p className="text-sm text-muted-foreground">
          Pick a second person to find the connection.
        </p>
      ) : null}
    </div>
  )
}

export function ConnectPageSkeleton() {
  return (
    <div
      className="flex flex-col gap-8"
      aria-label="Loading connections"
      aria-busy="true"
    >
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-medium">Connections</h1>
        <p className="text-sm text-muted-foreground">
          Search two people to see how they connect through films.
        </p>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <PersonSearchSkeleton />
        <Skeleton className="size-9 shrink-0" />
        <PersonSearchSkeleton />
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>
      <ConnectionPathSkeleton />
    </div>
  )
}
