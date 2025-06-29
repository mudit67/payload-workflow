import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Define protected routes that require authentication
const protectedRoutes = ['/workflow', '/admin', '/post']

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/', '/api/auth']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // Check if current route is public
  const isPublicRoute = publicRoutes.some((route) => path === route || path.startsWith(route))

  // Get the payload token from cookies
  const payloadToken = request.cookies.get('payload-token')?.value

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !payloadToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path) // Save intended destination
    return NextResponse.redirect(loginUrl)
  }

  // If accessing public route with valid token, optionally redirect to dashboard
  if (isPublicRoute && payloadToken && path === '/login') {
    return NextResponse.redirect(new URL('/workflow', request.url))
  }

  return NextResponse.next()
}

// Configure which routes middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
