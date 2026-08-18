import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Movie } from '@/cognodb/schema'
import { Skeleton } from '@/components/ui/skeleton'

export function MovieCard({ movie }: { movie: Movie & { genres: string[] } }) {
  return (
    <Link href={`/movies/${movie.slug}`} className="block h-full">
      <Card className="h-full transition-colors hover:bg-muted/60">
        <CardHeader>
          <CardTitle className="text-lg leading-snug">{movie.title}</CardTitle>
          <CardDescription>
            {movie.year} · {movie.runtimeMin} min
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 pb-(--card-spacing)">
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {movie.plot}
          </p>
          <div className="mt-auto flex flex-wrap gap-1.5">
            {movie.genres.slice(0, 3).map((name) => (
              <Badge key={name} variant="secondary">
                {name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function MovieCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-(--card-spacing)">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-2 flex gap-1.5">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardContent>
    </Card>
  )
}