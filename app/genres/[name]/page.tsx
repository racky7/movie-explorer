import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MovieGrid } from '@/app/movies/[slug]/-component/movie-grid'
import { caller } from '@/trpc/server'

type GenrePageProps = {
  params: Promise<{ name: string }>
}

export async function generateMetadata({
  params,
}: GenrePageProps): Promise<Metadata> {
  const { name } = await params
  const decoded = decodeURIComponent(name)
  const genre = await caller.genres.byName({ name: decoded })
  return { title: genre?.name ?? 'Genre' }
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { name } = await params
  const genre = await caller.genres.byName({ name: decodeURIComponent(name) })

  if (!genre) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-medium">{genre.name}</h1>
        <p className="text-sm text-muted-foreground">Movies in this genre</p>
      </div>
      <MovieGrid movies={genre.movies} />
    </div>
  )
}
