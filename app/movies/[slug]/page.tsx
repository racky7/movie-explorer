import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CreditRow } from './-component/credit-row'
import { MovieGrid } from './-component/movie-grid'
import { MovieHero } from './-component/movie-hero'
import { Section } from '@/components/shared/section'
import { Separator } from '@/components/ui/separator'
import { caller } from '@/trpc/server'

type MoviePageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: MoviePageProps): Promise<Metadata> {
  const { slug } = await params
  const movie = await caller.movies.bySlug({ slug })
  return { title: movie?.title ?? 'Movie' }
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { slug } = await params
  const [movie, related] = await Promise.all([
    caller.movies.bySlug({ slug }),
    caller.movies.related({ slug }),
  ])

  if (!movie) notFound()

  return (
    <div className="flex flex-col gap-8">
      <MovieHero movie={movie} />
      <Separator />
      <Section title="Cast">
        <CreditRow people={movie.cast} />
      </Section>
      <Section title="Directors">
        <CreditRow people={movie.directors} />
      </Section>
      <Section title="Writers">
        <CreditRow people={movie.writers} />
      </Section>
      <Section title="More like this">
        <MovieGrid movies={related} />
      </Section>
    </div>
  )
}
