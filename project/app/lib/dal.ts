import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from '@/app/lib/session'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return { isAuth: true, userId: session.userId, role: session.role, username: session.username }
})

export const getSessionOptional = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  return await decrypt(cookie)
})
