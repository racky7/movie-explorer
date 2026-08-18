import Link from 'next/link'
import type { Person } from '@/cognodb/schema'
import { PersonCard } from '@/app/people/[slug]/-component/person-card'
import { Skeleton } from '@/components/ui/skeleton'

export function CreditRow({
  people,
}: {
  people: Array<Person & { role?: string }>
}) {
  if (people.length === 0) {
    return <p className="text-sm text-muted-foreground">None listed.</p>
  }

  return (
    <ul className="flex gap-4 overflow-x-auto pb-2">
      {people.map((person) => (
        <li key={person.slug} className="shrink-0">
          <PersonCard
            person={person}
            role={'role' in person ? person.role : undefined}
          />
        </li>
      ))}
    </ul>
  )
}

export function CreditNames({
  title,
  people,
}: {
  title: string
  people: Person[]
}) {
  return (
    <section className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="font-heading shrink-0 text-lg font-medium">{title}</h2>
      {people.length === 0 ? (
        <p className="text-sm text-muted-foreground">None listed.</p>
      ) : (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {people.map((person) => (
            <li key={person.slug}>
              <Link
                href={`/people/${person.slug}`}
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                {person.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function CreditNamesSkeleton({
  title,
  count = 2,
}: {
  title: string
  count?: number
}) {
  return (
    <section className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h2 className="font-heading shrink-0 text-lg font-medium">{title}</h2>
      <ul
        className="flex flex-wrap gap-x-3 gap-y-1"
        aria-label="Loading people"
        aria-busy="true"
      >
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-4 w-28" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function CreditRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul
      className="flex gap-4 overflow-hidden pb-2"
      aria-label="Loading people"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="flex w-28 shrink-0 flex-col items-center gap-2"
        >
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-14" />
        </li>
      ))}
    </ul>
  )
}
