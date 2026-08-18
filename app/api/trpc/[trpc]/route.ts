import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/trpc/init'
import { appRouter } from '@/trpc/routers'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError({ error, path, type }) {
      if (error.code === 'SERVICE_UNAVAILABLE') {
        console.error(
          `[trpc] ${type} ${path ?? '<no-path>'}: database unavailable —`,
          error.cause
        )
        return
      }

      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error(`[trpc] ${type} ${path ?? '<no-path>'}:`, error)
      }
    },
  })

export { handler as GET, handler as POST }
