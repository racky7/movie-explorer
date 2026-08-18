import neo4j, { Neo4jError, type Driver } from 'neo4j-driver'
import { env } from '@/lib/env'

const globalForCognoDB = globalThis as unknown as { cognodb?: Driver }

/**
 * Fail fast when CognoDB is unreachable. Without explicit timeouts the driver
 * falls back to the OS-level TCP timeout, which parks a request for far longer
 * than a user — or a serverless function budget — will wait.
 */
const driverConfig = {
  connectionTimeout: 5_000,
  connectionAcquisitionTimeout: 10_000,
  maxTransactionRetryTime: 5_000,
  disableLosslessIntegers: true,
}

export const cognodb =
  globalForCognoDB.cognodb ||
  neo4j.driver(
    env.COGNODB_URI,
    neo4j.auth.basic(env.COGNODB_USERNAME, env.COGNODB_PASSWORD),
    driverConfig
  )

if (process.env.NODE_ENV !== 'production') {
  globalForCognoDB.cognodb = cognodb
}

/** Driver and server codes that all mean "we cannot serve data right now". */
const UNAVAILABLE_CODES = new Set<string>([
  neo4j.error.SERVICE_UNAVAILABLE,
  neo4j.error.SESSION_EXPIRED,
  'Neo.ClientError.Security.Unauthorized',
  'Neo.ClientError.Security.AuthenticationRateLimit',
  'Neo.ClientError.Database.DatabaseUnavailable',
  'Neo.TransientError.General.DatabaseUnavailable',
])

/** Socket-level failures, for the paths where the driver rethrows them raw. */
const UNAVAILABLE_SYSCALL_CODES = new Set<string>([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
])

/** Thrown in place of the raw driver error when CognoDB cannot be reached. */
export class DatabaseUnavailableError extends Error {
  override readonly name = 'DatabaseUnavailableError'

  constructor(cause: unknown) {
    super('CognoDB is unreachable', { cause })
  }
}

/** True when `error` means the database is down rather than the query is bad. */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) return true
  if (error instanceof Neo4jError) return UNAVAILABLE_CODES.has(error.code)
  if (error instanceof Error && 'code' in error) {
    return UNAVAILABLE_SYSCALL_CODES.has(String(error.code))
  }
  return false
}

/**
 * Runs `fn` against CognoDB, normalizing connectivity failures into
 * {@link DatabaseUnavailableError}. Errors caused by the query itself (bad
 * Cypher, constraint violations) pass through untouched.
 */
export async function withDatabase<T>(
  fn: (driver: Driver) => Promise<T>
): Promise<T> {
  try {
    return await fn(cognodb)
  } catch (error) {
    if (isDatabaseUnavailable(error)) throw new DatabaseUnavailableError(error)
    throw error
  }
}

export type DatabaseHealth =
  | { status: 'ok' }
  | { status: 'unavailable'; message: string }

/**
 * Probes CognoDB without throwing, so a health view can render a degraded state
 * instead of an error boundary.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    await cognodb.verifyConnectivity()
    return { status: 'ok' }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'CognoDB is unreachable'
    const code = error instanceof Neo4jError ? ` [${error.code}]` : ''
    console.error(`[cognodb] connectivity check failed${code}: ${message}`)
    // The driver message names the host and port, so keep it in the logs —
    // this result is served to the browser.
    return { status: 'unavailable', message: 'CognoDB is unreachable' }
  }
}
