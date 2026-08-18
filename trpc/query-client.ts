import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import type { AppRouter } from './routers'

/**
 * An unreachable database is usually a blip, so retry a couple of times — but
 * never retry a request the server rejected on its merits (400/404/…), which
 * would only add latency to an error the user already has.
 */
function retryOnTransientFailure(failureCount: number, error: Error) {
  if (failureCount >= 2) return false
  if (!(error instanceof TRPCClientError)) return true

  const { httpStatus } = (error as TRPCClientError<AppRouter>).data ?? {}
  // No status means the request never reached the server (offline, DNS, …).
  return httpStatus === undefined || httpStatus >= 500
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keeps the client from immediately refetching data the server prefetched.
        staleTime: 30 * 1000,
        retry: retryOnTransientFailure,
      },
      dehydrate: {
        // Also ship pending queries, so prefetch-without-await can stream in.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  })
}
