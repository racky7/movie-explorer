import { createTRPCRouter } from '../init'
import { healthRouter } from './health/health.router'

export const appRouter = createTRPCRouter({
  health: healthRouter,
})

export type AppRouter = typeof appRouter
