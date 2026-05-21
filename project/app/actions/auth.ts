'use server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/app/lib/drizzle'
import { users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { createSession, deleteSession, verifyRSASignature } from '@/app/lib/session'
import { checkRateLimit } from '@/app/lib/rateLimit'

const LoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

const RegisterSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  email: z.string().email().trim(),
  password: z.string().min(8),
  rsaPublicKey: z.string().optional(),
})

export type AuthErrors = { username?: string[]; email?: string[]; password?: string[]; general?: string[] }
export type AuthState = { errors?: AuthErrors; message?: string } | undefined

// Standard login: username + password
export async function login(state: AuthState, formData: FormData): Promise<AuthState> {
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!checkRateLimit(`login:${ip}`, 5, 60_000)) {
    return { errors: { general: ['Too many login attempts. Please try again in a minute.'] } }
  }

  const validated = LoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as AuthErrors }
  }

  const { username, password } = validated.data
  const result = await db.query.users.findFirst({
    where: eq(users.username, username),
  })
  if (!result) {
    return { errors: { general: ['Invalid username or password'] } }
  }

  if (!result.passwordHash) {
    return { errors: { general: ['This account uses Google Sign-In. Please use "Continue with Google".'] } }
  }

  const passwordMatch = await bcrypt.compare(password, result.passwordHash)
  if (!passwordMatch) {
    return { errors: { general: ['Invalid username or password'] } }
  }

  await createSession(result.id, result.role, result.username)
  redirect('/app')
}

// RSA login: username + signed challenge
export async function rsaLogin(state: AuthState, formData: FormData): Promise<AuthState> {
  const username = formData.get('username') as string
  const signature = formData.get('signature') as string
  const challenge = formData.get('challenge') as string

  if (!username || !signature || !challenge) {
    return { errors: { general: ['Missing required fields'] } }
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  })
  if (!user || !user.rsaPublicKey) {
    return { errors: { general: ['RSA login not configured for this user'] } }
  }

  const isValid = await verifyRSASignature(user.rsaPublicKey, challenge, signature)
  if (!isValid) {
    return { errors: { general: ['Invalid RSA signature'] } }
  }

  await createSession(user.id, user.role, user.username)
  redirect('/app')
}

// Register new user
export async function register(state: AuthState, formData: FormData): Promise<AuthState> {
  const validated = RegisterSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    rsaPublicKey: formData.get('rsaPublicKey') || undefined,
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as AuthErrors }
  }

  const { username, email, password, rsaPublicKey } = validated.data
  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  })
  if (existing) {
    return { errors: { username: ['Username already taken'] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const newUsers = await db.insert(users).values({
    username,
    email,
    passwordHash,
    rsaPublicKey: rsaPublicKey ?? null,
    role: 'user',
  }).returning({ id: users.id, role: users.role, username: users.username })

  const newUser = newUsers[0]
  await createSession(newUser.id, newUser.role, newUser.username)
  redirect('/app')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
