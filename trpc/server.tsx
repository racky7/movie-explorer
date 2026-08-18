import 'server-only'

import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { cache } from 'react'
import { createTRPCContext } from './init'
import { makeQueryClient } from './query-client'
import { appRouter } from './routers'

export const getQueryClient = cache(makeQueryClient)

/** Use in RSCs to prefetch into the query client before hydrating. */
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
})

/** Use in RSCs to call procedures directly, with no HTTP round trip. */
export const caller = appRouter.createCaller(createTRPCContext)
