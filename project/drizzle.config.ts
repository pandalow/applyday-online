import { config } from 'dotenv'
config({ path: '.env.local' })
import type { Config } from 'drizzle-kit'

export default {
  dialect: 'postgresql',
  schema: './app/db/schema.ts',
  out: './drizzle/migrations',
  verbose: true,
  dbCredentials: {
    url: process.env.DIRECT_URL!,
  },
} satisfies Config
