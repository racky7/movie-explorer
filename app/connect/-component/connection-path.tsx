import Link from 'next/link'
import { LinkBreakIcon } from '@phosphor-icons/react'
import type {
  CreditType,
  ConnectionHop,
  ConnectionResult,
} from '@/trpc/routers/people/people.lib'
import { RelType } from '@/cognodb/schema'
import type { Person } from '@/cognodb/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function creditVerb(credit: CreditType, role?: string) {
  if (credit === RelType.ACTED_IN) {
    return role ? `acted as ${role}` : 'acted'
  }
  if (credit === RelType.DIRECTED) return 'directed'
  return 'wrote'
}

function degreeCopy(result: ConnectionResult) {
  if (result.degrees === 0) {
    return {
      title: 'Same person',
      description: `${result.from.name} is 0 degrees from themselves.`,
    }
  }
  if (result.degrees == null) {
    return {
      title: 'No connection found',
      description: 'No collaboration chain within 6 steps in this catalog.',
    }
  }
  if (result.degrees === 1) {
    return {
      title: '1 degree apart',
      description: `${result.from.name} and ${result.to.name} worked on the same film.`,
    }
  }
  return {
    title: `${result.degrees} degrees apart`,
    description: `${result.from.name} and ${result.to.name} connect through ${result.hops.length} films.`,
  }
}

function PersonLink({ person }: { person: Person }) {
  return (
    <Link
      href={`/people/${person.slug}`}
      className="font-medium text-foreground underline-offset-4 hover:underline"
    >
      {person.name}
    </Link>
  )
}

function CreditLine({
  person,
  credit,
  role,
}: {
  person: Person
  credit: CreditType
  role?: string
}) {
  return (
    <p className="text-sm text-muted-foreground">
      <PersonLink person={person} /> {creditVerb(credit, role)}
    </p>
  )
}

function HopCard({ hop }: { hop: ConnectionHop }) {
  return (
    <div className="mt-3 mb-1 rounded-2xl bg-muted/60 p-3 ring-1 ring-foreground/5">
      <Link
        href={`/movies/${hop.movie.slug}`}
        className="block truncate text-sm font-medium underline-offset-4 hover:underline"
      >
        {hop.movie.title}{' '}
        <span className="font-normal text-muted-foreground">
          ({hop.movie.year})
        </span>
      </Link>
      <div className="mt-2 flex flex-col gap-0.5">
        <CreditLine
          person={hop.from}
          credit={hop.fromCredit}
          role={hop.fromRole}
        />
        <CreditLine person={hop.to} credit={hop.toCredit} role={hop.toRole} />
      </div>
    </div>
  )
}

function PersonName({ person, caption }: { person: Person; caption?: string }) {
  return (
    <div className="flex min-h-6 min-w-0 flex-col justify-center">
      <PersonLink person={person} />
      {caption ? (
        <p className="text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  )
}

export function ConnectionPath({ result }: { result: ConnectionResult }) {
  const copy = degreeCopy(result)
  const people = result.hops.length
    ? [result.hops[0].from, ...result.hops.map((hop) => hop.to)]
    : [result.from]

  if (result.degrees == null) {
    return (
      <Card className="max-w-2xl">
        <CardHeader className="items-center py-10 text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <LinkBreakIcon className="size-5" />
          </div>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription className="max-w-sm text-pretty">
            {copy.description}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader className="border-b">
          <div className="min-w-0 flex-1">
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription className="text-pretty">
              {copy.description}
            </CardDescription>
          </div>
      </CardHeader>
      <CardContent>
        <ol aria-label="Collaboration path" className="flex flex-col">
          {people.map((person, index) => {
            const hop = result.hops[index]
            const isFirst = index === 0
            const isLast = index === people.length - 1
            const caption = isFirst
              ? 'Starting from'
              : isLast
                ? 'Connected to'
                : undefined

            return (
              <li
                key={`${person.slug}-${index}`}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4"
              >
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1.5 size-2.5 shrink-0 rounded-full bg-foreground',
                      isLast && 'bg-primary',
                    )}
                  />
                  {hop ? (
                    <span aria-hidden className="w-px flex-1 bg-border" />
                  ) : null}
                </div>
                <div className={cn('min-w-0', !isLast && 'pb-2')}>
                  <PersonName person={person} caption={caption} />
                  {hop ? <HopCard hop={hop} /> : null}
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

export function ConnectionPathSkeleton({ hops = 2 }: { hops?: number }) {
  return (
    <Card
      className="max-w-2xl"
      aria-label="Loading connection"
      aria-busy="true"
    >
      <CardHeader className="border-b">
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-5 w-40 max-w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {Array.from({ length: hops + 1 }, (_, index) => (
            <li
              key={index}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4"
            >
              <div className="flex flex-col items-center">
                <Skeleton className="mt-1.5 size-2.5 shrink-0 rounded-full" />
                {index < hops ? (
                  <span aria-hidden className="w-px flex-1 bg-border" />
                ) : null}
              </div>
              <div className={cn('min-w-0', index < hops && 'pb-2')}>
                <div className="flex min-h-6 flex-col justify-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                {index < hops ? (
                  <div className="mt-3 mb-1 flex flex-col gap-2 rounded-2xl bg-muted/60 p-3">
                    <Skeleton className="h-4 w-44 max-w-full" />
                    <Skeleton className="h-4 w-56 max-w-full" />
                    <Skeleton className="h-4 w-40 max-w-full" />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
