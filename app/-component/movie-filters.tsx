'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Person } from '@/cognodb/schema'

const ANY = 'all'
const SEARCH_DEBOUNCE_MS = 300

type FilterValues = {
  q?: string
  year?: number
  genre?: string
  person?: string
}

function toFilterValues({
  q,
  year,
  genre,
  person,
}: {
  q: string
  year: string
  genre: string
  person: string
}): FilterValues {
  return {
    q: q.trim() || undefined,
    year: year === ANY ? undefined : Number.parseInt(year, 10),
    genre: genre === ANY ? undefined : genre,
    person: person === ANY ? undefined : person,
  }
}

export function MovieFilters({
  genres,
  people,
  years,
  values,
  onChange,
}: {
  genres: string[]
  people: Person[]
  years: number[]
  values: FilterValues
  onChange: (values: FilterValues) => void
}) {
  const [q, setQ] = useState(values.q ?? '')
  const debouncedQ = useDebounce(q, SEARCH_DEBOUNCE_MS)
  const year = values.year?.toString() ?? ANY
  const genre = values.genre ?? ANY
  const person = values.person ?? ANY

  const onSearch = useEffectEvent((nextQ: string) => {
    onChange(toFilterValues({ q: nextQ, year, genre, person }))
  })

  useEffect(() => {
    onSearch(debouncedQ)
  }, [debouncedQ])

  const hasActiveFilters =
    q.trim() !== '' || year !== ANY || genre !== ANY || person !== ANY

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onChange(toFilterValues({ q, year, genre, person }))
      }}
      className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end"
    >
      <label className="flex min-w-48 flex-1 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Search</span>
        <Input
          name="q"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Title or plot"
        />
      </label>
      <label className="flex min-w-36 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Year</span>
        <Select
          value={year}
          items={[
            { value: ANY, label: 'Any year' },
            ...years.map((option) => ({
              value: String(option),
              label: String(option),
            })),
          ]}
          onValueChange={(next) => {
            onChange(toFilterValues({ q, year: next ?? ANY, genre, person }))
          }}
        >
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
        <Combobox
          items={genres}
          value={genre === ANY ? null : genre}
          onValueChange={(next) => {
            onChange(toFilterValues({ q, year, genre: next ?? ANY, person }))
          }}
          autoHighlight
        >
          <ComboboxInput placeholder="Any genre" showClear className="w-full" />
          <ComboboxContent>
            <ComboboxEmpty>No genres found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </label>
      <label className="flex min-w-44 flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Actor</span>
        <Combobox
          items={people}
          value={
            person === ANY
              ? null
              : (people.find((option) => option.slug === person) ?? null)
          }
          onValueChange={(next) => {
            onChange(
              toFilterValues({
                q,
                year,
                genre,
                person: next?.slug ?? ANY,
              }),
            )
          }}
          itemToStringLabel={(option) => option.name}
          isItemEqualToValue={(item, value) => item.slug === value.slug}
          autoHighlight
        >
          <ComboboxInput placeholder="Any actor" showClear className="w-full" />
          <ComboboxContent>
            <ComboboxEmpty>No actors found.</ComboboxEmpty>
            <ComboboxList>
              {(option) => (
                <ComboboxItem key={option.slug} value={option}>
                  {option.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </label>
      <Button
        type="button"
        variant="outline"
        disabled={!hasActiveFilters}
        onClick={() => {
          setQ('')
          onChange({})
        }}
      >
        Clear filters
      </Button>
    </form>
  )
}

export function MovieFiltersSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end"
      aria-label="Loading filters"
      aria-busy="true"
    >
      <div className="flex min-w-48 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex min-w-36 flex-col gap-1.5">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-9 w-full md:w-36" />
      </div>
      <div className="flex min-w-36 flex-col gap-1.5">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-9 w-full md:w-36" />
      </div>
      <div className="flex min-w-44 flex-col gap-1.5">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-9 w-full md:w-44" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  )
}
