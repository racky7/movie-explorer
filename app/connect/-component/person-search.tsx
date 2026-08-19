'use client'

import { skipToken } from '@tanstack/react-query'
import { useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import type { Person } from '@/cognodb/schema'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'

const SEARCH_DEBOUNCE_MS = 300

function toPerson(person: Person): Person {
  return {
    slug: person.slug,
    name: person.name,
    bornYear: person.bornYear,
    photoUrl: person.photoUrl,
  }
}

export function PersonSearch({
  label,
  slug,
  person,
  onPersonChange,
}: {
  label: string
  slug: string | null
  person: Person | null
  onPersonChange: (person: Person | null) => void
}) {
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query.trim(), SEARCH_DEBOUNCE_MS)
  const search = debounced.length >= 1 ? debounced : undefined

  const selectedQuery = trpc.people.bySlug.useQuery(
    slug && person == null ? { slug } : skipToken,
  )
  const fetched =
    selectedQuery.data != null ? toPerson(selectedQuery.data) : null
  const selected = person ?? fetched

  const listQuery = trpc.people.list.useQuery({
    q: search,
    limit: 20,
  })

  const results = listQuery.data ?? []
  const items =
    selected && !results.some((option) => option.slug === selected.slug)
      ? [selected, ...results]
      : results

  const missing = Boolean(
    slug && selectedQuery.status === 'success' && selectedQuery.data == null,
  )

  return (
    <label className="flex min-w-44 flex-1 flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Combobox
        items={items}
        value={selected}
        filter={null}
        autoHighlight
        onValueChange={(next) => {
          onPersonChange(next ? toPerson(next) : null)
        }}
        onInputValueChange={(next) => {
          setQuery(next)
        }}
        itemToStringLabel={(option) => option.name}
        isItemEqualToValue={(item, value) => item.slug === value.slug}
      >
        <ComboboxInput
          placeholder="Search people"
          showClear
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {listQuery.isFetching ? 'Searching…' : 'No people found.'}
          </ComboboxEmpty>
          <ComboboxList>
            {(option) => (
              <ComboboxItem key={option.slug} value={option}>
                {option.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {missing ? (
        <p className="text-xs text-muted-foreground">
          That person is not in the catalog.
        </p>
      ) : null}
    </label>
  )
}

export function PersonSearchSkeleton() {
  return (
    <div className="flex min-w-44 flex-1 flex-col gap-1.5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}
