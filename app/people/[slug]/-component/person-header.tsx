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

export function PersonHeader({ person }: { person: Person }) {
  return (
    <div className="flex items-start gap-6">
      <Avatar className="size-28">
        <AvatarFallback className="text-2xl">
          {initials(person.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-medium">{person.name}</h1>
        {person.bornYear ? (
          <p className="text-sm text-muted-foreground">
            Born {person.bornYear}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Birth year unknown</p>
        )}
      </div>
    </div>
  )
}
