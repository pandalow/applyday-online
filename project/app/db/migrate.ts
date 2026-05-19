import 'dotenv/config'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export async function applyMigrations() {
  // Direct connection required for DDL — use DIRECT_URL (port 5432, not pooler)
  const migrationClient = postgres(process.env.DIRECT_URL!, { max: 1 })
  const db = drizzle(migrationClient)
  await migrate(db, { migrationsFolder: 'drizzle/migrations' })
  await migrationClient.end()
}

if (require.main === module) {
  applyMigrations()
    .then(() => { console.log('Migrations applied'); process.exit(0) })
    .catch((err) => { console.error('Migration failed:', err); process.exit(1) })
}
