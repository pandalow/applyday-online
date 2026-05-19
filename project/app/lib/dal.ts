import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from '@/app/lib/session'
import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return { isAuth: true, userId: session.userId, role: session.role, username: session.username }
})

export const getUser = cache(async () => {
  const session = await verifySession()
  if (!session) return null

  try {
    const data = await db.query.users.findMany({
      where: eq(users.id, session.userId),
      columns: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
    return data[0] ?? null
  } catch {
    return null
  }
})

export const getSessionOptional = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  return await decrypt(cookie)
})
