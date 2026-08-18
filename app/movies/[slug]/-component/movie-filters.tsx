'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Person } from '@/cognodb/schema'

const ANY = 'all'

export function MovieFilters({
  genres,
  people,
  years,
  values,
}: {
  genres: string[]
  people: Person[]
  years: number[]
  values: {
    q?: string
    year?: number
    genre?: string
    person?: string
  }
}) {
  const router = useRouter()
  const [q, setQ] = useState(values.q ?? '')
  const [year, setYear] = useState(values.year?.toString() ?? ANY)
  const [genre, setGenre] = useState(values.genre ?? ANY)
  const [person, setPerson] = useState(values.person ?? ANY)

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (year !== ANY) params.set('year', year)
    if (genre !== ANY) params.set('genre', genre)
    if (person !== ANY) params.set('person', person)
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end"
    >
      <label className="flex min-w-48 flex-1 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Search</span>
        <Input
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Movie title"
        />
      </label>
      <label className="flex min-w-36 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Year</span>
        <Select value={year} onValueChange={(next) => setYear(next ?? ANY)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any year</SelectItem>
            {years.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex min-w-36 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Genre</span>
        <Select value={genre} onValueChange={(next) => setGenre(next ?? ANY)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any genre</SelectItem>
            {genres.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex min-w-44 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Actor</span>
        <Select value={person} onValueChange={(next) => setPerson(next ?? ANY)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any actor</SelectItem>
            {people.map((option) => (
              <SelectItem key={option.slug} value={option.slug}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <Button type="submit">Filter</Button>
    </form>
  )
}
