import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/app/db/schema'

// Transaction mode pooler (Supabase port 6543) — prepare:false required for pgBouncer
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

export const db = drizzle(client, { schema })
