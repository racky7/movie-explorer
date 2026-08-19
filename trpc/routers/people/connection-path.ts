import * as z from 'zod'
import { movieSchema, personSchema, RelType } from '@/cognodb/schema'

export const creditTypeSchema = z.enum([
  RelType.ACTED_IN,
  RelType.DIRECTED,
  RelType.WROTE,
])

export type CreditType = z.infer<typeof creditTypeSchema>

const pathPersonNodeSchema = personSchema.extend({
  kind: z.literal('person'),
})

const pathMovieNodeSchema = movieSchema.extend({
  kind: z.literal('movie'),
})

const pathNodeSchema = z.discriminatedUnion('kind', [
  pathPersonNodeSchema,
  pathMovieNodeSchema,
])

const pathRelSchema = z.object({
  type: creditTypeSchema,
  role: z.string().nullish(),
})

export const connectionHopSchema = z.object({
  from: personSchema,
  to: personSchema,
  movie: movieSchema,
  fromCredit: creditTypeSchema,
  toCredit: creditTypeSchema,
  fromRole: z.string().optional(),
  toRole: z.string().optional(),
})

export type ConnectionHop = z.infer<typeof connectionHopSchema>

export const connectionResultSchema = z.object({
  from: personSchema,
  to: personSchema,
  degrees: z.number().int().min(0).nullable(),
  hops: z.array(connectionHopSchema),
})

export type ConnectionResult = z.infer<typeof connectionResultSchema>

function roleForCredit(
  credit: CreditType,
  role: string | null | undefined,
): string | undefined {
  if (credit !== RelType.ACTED_IN) return undefined
  return role || undefined
}

export function hopsFromPath(nodes: unknown, rels: unknown): ConnectionHop[] {
  const parsedNodes = z.array(pathNodeSchema).parse(nodes)
  const parsedRels = z.array(pathRelSchema).parse(rels)

  if (parsedNodes.length === 0) return []
  if (parsedNodes.length < 3 || parsedNodes.length % 2 === 0) {
    throw new Error('Connection path must alternate Person and Movie')
  }
  if (parsedRels.length !== parsedNodes.length - 1) {
    throw new Error('Connection path relationship count does not match nodes')
  }

  const hops: ConnectionHop[] = []

  for (let i = 0; i + 2 < parsedNodes.length; i += 2) {
    const fromNode = parsedNodes[i]
    const movieNode = parsedNodes[i + 1]
    const toNode = parsedNodes[i + 2]
    const fromRel = parsedRels[i]
    const toRel = parsedRels[i + 1]

    if (
      fromNode?.kind !== 'person' ||
      toNode?.kind !== 'person' ||
      movieNode?.kind !== 'movie' ||
      fromRel == null ||
      toRel == null
    ) {
      throw new Error('Connection path must be Person-Movie-Person')
    }

    hops.push(
      connectionHopSchema.parse({
        from: personSchema.parse(fromNode),
        to: personSchema.parse(toNode),
        movie: movieSchema.parse(movieNode),
        fromCredit: fromRel.type,
        toCredit: toRel.type,
        fromRole: roleForCredit(fromRel.type, fromRel.role),
        toRole: roleForCredit(toRel.type, toRel.role),
      }),
    )
  }

  return hops
}
