import type { Movie } from '@/cognodb/schema'
import { MovieCard } from './movie-card'

export function MovieGrid({
  movies,
}: {
  movies: Array<Movie & { genres: string[] }>
}) {
  if (movies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No movies to show yet.</p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {movies.map((movie) => (
        <li key={movie.slug}>
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  )
}
