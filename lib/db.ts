import neo4j, { Neo4jError, type Driver, type Session } from 'neo4j-driver'
import { env } from '@/lib/env'

const globalForCognoDB = globalThis as unknown as { cognodb?: Driver }

export const cognodb =
  globalForCognoDB.cognodb ||
  neo4j.driver(
    env.COGNODB_URI,
    neo4j.auth.basic(env.COGNODB_USERNAME, env.COGNODB_PASSWORD),
    { disableLosslessIntegers: true },
  )

if (process.env.NODE_ENV !== 'production') {
  globalForCognoDB.cognodb = cognodb
}

export class DatabaseUnavailableError extends Error {
  constructor(message = 'CognoDB is unreachable', options?: ErrorOptions) {
    super(message, options)
    this.name = 'DatabaseUnavailableError'
  }
}

export function isDatabaseUnavailable(error: unknown): boolean {
  return error instanceof DatabaseUnavailableError
}

const UNAVAILABLE_CODES = new Set([
  'ServiceUnavailable',
  'SessionExpired',
  'Neo.ClientError.Security.Unauthorized',
  'Neo.ClientError.Security.AuthenticationRateLimit',
])

function rethrowAsDatabaseError(error: unknown): never {
  if (error instanceof DatabaseUnavailableError) throw error

  if (error instanceof Neo4jError && UNAVAILABLE_CODES.has(error.code)) {
    throw new DatabaseUnavailableError('CognoDB is unreachable', {
      cause: error,
    })
  }

  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code
    if (
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === 'ETIMEDOUT' ||
      code === 'EHOSTUNREACH'
    ) {
      throw new DatabaseUnavailableError('CognoDB is unreachable', {
        cause: error,
      })
    }
  }

  throw error
}

export async function runQuery(
  cypher: string,
  parameters?: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  const session: Session = cognodb.session({})
  try {
    const result = await session.executeRead((tx) => tx.run(cypher, parameters))
    return result.records.map((record) => record.toObject())
  } catch (error) {
    rethrowAsDatabaseError(error)
  } finally {
    await session.close()
  }
}

export async function runWrite(
  cypher: string,
  parameters?: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  const session: Session = cognodb.session({})
  try {
    const result = await session.executeWrite((tx) =>
      tx.run(cypher, parameters),
    )
    return result.records.map((record) => record.toObject())
  } catch (error) {
    rethrowAsDatabaseError(error)
  } finally {
    await session.close()
  }
}

export type DatabaseHealth =
  { status: 'ok' } | { status: 'unavailable'; message: string }

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    await cognodb.verifyConnectivity()
    return { status: 'ok' }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'CognoDB is unreachable'
    const code = error instanceof Neo4jError ? ` [${error.code}]` : ''
    console.error(`[cognodb] connectivity check failed${code}: ${message}`)
    return { status: 'unavailable', message: 'CognoDB is unreachable' }
  }
}
