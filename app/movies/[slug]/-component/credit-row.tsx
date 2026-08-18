import type { Person } from '@/cognodb/schema'
import { PersonCard } from '@/app/people/[slug]/-component/person-card'

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
