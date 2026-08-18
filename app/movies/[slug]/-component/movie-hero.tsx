import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

export function MovieHeroSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      aria-label="Loading movie"
      aria-busy="true"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>
      <div className="flex max-w-2xl flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}
