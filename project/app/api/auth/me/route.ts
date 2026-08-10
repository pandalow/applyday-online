import { verifySession } from '@/app/lib/dal'
import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await verifySession()

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: { id: true, username: true, email: true, role: true },
  })

  return Response.json(user ?? null)
}
