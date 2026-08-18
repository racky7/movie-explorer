import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Movie } from '@/cognodb/schema'

export function MovieHero({ movie }: { movie: Movie & { genres: string[] } }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="font-heading text-3xl font-medium">{movie.title}</h1>
        <p className="text-sm text-muted-foreground">
          {movie.year} · {movie.runtimeMin} min
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {movie.genres.map((name) => (
          <Badge
            key={name}
            variant="secondary"
            render={<Link href={`/genres/${encodeURIComponent(name)}`} />}
          >
            {name}
          </Badge>
        ))}
      </div>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
        {movie.plot}
      </p>
    </div>
  )
}
