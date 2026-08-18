import neo4j, { Neo4jError, type Driver, type Session } from 'neo4j-driver'
import { env } from '@/lib/env'

const globalForCognoDB = globalThis as unknown as { cognodb?: Driver }

export const cognodb =
  globalForCognoDB.cognodb ||
  neo4j.driver(
    env.COGNODB_URI,
    neo4j.auth.basic(env.COGNODB_USERNAME, env.COGNODB_PASSWORD),
  )

if (process.env.NODE_ENV !== 'production') {
  globalForCognoDB.cognodb = cognodb
}

export async function runQuery(
  cypher: string,
  parameters?: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  const session: Session = cognodb.session({})
  try {
    const result = await session.executeRead((tx) => tx.run(cypher, parameters))
    return result.records.map((record) => record.toObject())
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
