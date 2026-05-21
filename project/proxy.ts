import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/app/lib/session'

const protectedRoutes = ['/app', '/report', '/extract', '/admin', '/insight']
const adminRoutes = ['/admin']
const publicRoutes = ['/login', '/register', '/']

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(r => path.startsWith(r))
  const isAdminRoute = adminRoutes.some(r => path.startsWith(r))
  const isPublicRoute = publicRoutes.includes(path)

  const cookie = request.cookies.get('session')?.value
  const session = await decrypt(cookie)

  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if (isAdminRoute && session?.role !== 'admin') {
    return NextResponse.redirect(new URL('/app', request.nextUrl))
  }

  if (isPublicRoute && session?.userId && path !== '/') {
    return NextResponse.redirect(new URL('/app', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
