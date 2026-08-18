/**
 * Connectivity check for CognoDB. Run with: bun run db:check
 * Reads COGNODB_* from .env.local (Bun loads it automatically); `env` throws
 * with the offending variable names if any are missing or malformed.
 */
import neo4j from 'neo4j-driver'
import { env } from '../lib/env'

const driver = neo4j.driver(
  env.COGNODB_URI,
  neo4j.auth.basic(env.COGNODB_USERNAME, env.COGNODB_PASSWORD),
  { disableLosslessIntegers: true },
)

try {
  await driver.verifyConnectivity()
  const { records, summary } = await driver.executeQuery('RETURN 1 AS ok')
  console.log('Connected to', summary.server.address)
  console.log('Bolt protocol', summary.server.protocolVersion)
  console.log('Query returned ok =', records[0].get('ok'))

  const labels = await driver.executeQuery('CALL db.labels() YIELD label RETURN label')
  console.log(
    'Labels in graph:',
    labels.records.map((record) => record.get('label')).join(', ') || '(none yet)',
  )
} catch (error) {
  console.error('CognoDB connection failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await driver.close()
}
