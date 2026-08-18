'use client'

import type { QueryClient } from '@tanstack/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import { makeQueryClient } from './query-client'
import { trpc } from './client'


let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  // Server: a fresh client per request, so data never leaks between users.
  if (typeof window === 'undefined') return makeQueryClient()
  // Browser: one shared client for the life of the tab.
  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

function getUrl() {
  const base = (() => {
    if (typeof window !== 'undefined') return ''
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return 'http://localhost:3000'
  })()
  return `${base}/api/trpc`
}

export function TRPCReactProvider(
  props: Readonly<{ children: React.ReactNode }>,
) {
  const queryClient = getQueryClient()
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: getUrl() })],
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
