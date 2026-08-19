import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Person } from '@/cognodb/schema'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function PersonCard({
  person,
  role,
}: {
  person: Person
  role?: string
}) {
  return (
    <Link
      href={`/people/${person.slug}`}
      className="flex w-28 flex-col items-center gap-2 text-center"
    >
      <Avatar className="size-20">
        <AvatarFallback className="text-lg">
          {initials(person.name)}
        </AvatarFallback>
      </Avatar>
      <p className="text-sm font-medium">{person.name}</p>
      {role ? <p className="text-xs text-muted-foreground">{role}</p> : null}
    </Link>
  )
}
