import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MovieGrid } from '@/app/movies/[slug]/-component/movie-grid'
import { PersonHeader } from './-component/person-header'
import { Section } from '@/components/shared/section'
import { Separator } from '@/components/ui/separator'
import { caller } from '@/trpc/server'

type PersonPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PersonPageProps): Promise<Metadata> {
  const { slug } = await params
  const person = await caller.people.bySlug({ slug })
  return { title: person?.name ?? 'Person' }
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { slug } = await params
  const person = await caller.people.bySlug({ slug })

  if (!person) notFound()

  return (
    <div className="flex flex-col gap-8">
      <PersonHeader person={person} />
      <Separator />
      <Section title="Acted in">
        <MovieGrid movies={person.actedIn} />
      </Section>
      <Section title="Directed">
        <MovieGrid movies={person.directed} />
      </Section>
      <Section title="Wrote">
        <MovieGrid movies={person.wrote} />
      </Section>
    </div>
  )
}
