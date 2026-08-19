import type { Metadata } from 'next'
import { GenresIndex } from './-component/genres-index'

export const metadata: Metadata = {
  title: 'Genres',
  description: 'Browse the catalog by genre.',
}

export default function Page() {
  return <GenresIndex />
}
