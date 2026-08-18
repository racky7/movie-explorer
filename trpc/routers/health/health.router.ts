import { checkDatabaseHealth } from '@/lib/db'
import { createTRPCRouter, publicProcedure } from '@/trpc/init'

export const healthRouter = createTRPCRouter({
  /**
   * Reports connectivity instead of throwing on failure — a health probe that
   * 500s tells a caller less than one that says which dependency is down.
   */
  getDbHealth: publicProcedure.query(async function getDbHealth() {
    return checkDatabaseHealth()
  }),
})
