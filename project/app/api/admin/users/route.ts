import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { verifySession } from '@/app/lib/dal'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await verifySession()

  if (session.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))

  return Response.json(rows)
}
