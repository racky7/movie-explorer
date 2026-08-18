import { initTRPC, TRPCError } from '@trpc/server'
import { cache } from 'react'
import { DatabaseUnavailableError, isDatabaseUnavailable } from '@/lib/db'

export const createTRPCContext = cache(async () => {
  return {}
})

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    isDev: process.env.NODE_ENV === 'development',
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          // Lets the client tell "the database is down, try later" apart from
          // "this request was wrong", without parsing error messages.
          databaseUnavailable: isDatabaseUnavailable(error.cause),
        },
      }
    },
  })

/**
 * Turns a lost database connection into a 503 with a message that is safe to
 * show a user, keeping the driver error as `cause` for the server logs.
 */
const handleDatabaseErrors = t.middleware(async ({ next }) => {
  const result = await next()

  if (!result.ok && result.error.cause instanceof DatabaseUnavailableError) {
    throw new TRPCError({
      code: 'SERVICE_UNAVAILABLE',
      message: 'CognoDB is unreachable. Please try again in a moment.',
      cause: result.error.cause,
    })
  }

  return result
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure.use(handleDatabaseErrors)
