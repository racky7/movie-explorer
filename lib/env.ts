import { createEnv } from '@t3-oss/env-nextjs'
import * as z from 'zod'

export const env = createEnv({
  server: {
    COGNODB_URI: z.string(),
    COGNODB_USERNAME: z.string().min(1).default('cognodb'),
    COGNODB_PASSWORD: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    COGNODB_URI: process.env.COGNODB_URI,
    COGNODB_USERNAME: process.env.COGNODB_USERNAME,
    COGNODB_PASSWORD: process.env.COGNODB_PASSWORD,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
