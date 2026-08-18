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
