import { NextRequest, NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { decodeJwt, jwtVerify } from 'jose'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
// import payloadConfig = require('@payload-config');
// Define protected routes that require authentication
const protectedRoutes = ['/workflow', '/admin', '/post']

// Define admin-only routes
const adminOnlyRoutes = ['/workflow']

// Define staff-only routes (staff and admin can access)
const staffOnlyRoutes = ['/admin']

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/', '/api/auth', '/api/users/me']

async function getUserRole(token: string): Promise<string | null> {
  console.log('GetUserRole')
  try {
    // const payload = await getPayload({ config: payloadConfig })
    // const headersList = await headers()
    // const res = await payload.auth({ headers: headersList, canSetHeaders: false })
    // console.log(res)

    const response = await fetch(
      `${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/users/me`,
      {
        headers: {
          Cookie: `payload-token=${token}`,
        },
      },
    )

    if (response.ok) {
      const userData = await response.json()
      return userData.user?.role || null
    }
  } catch (error) {
    console.error('Error fetching user role:', error)
  }

  return null
}

export async function middleware(request: NextRequest) {
  console.log('Middleware')

  const path = request.nextUrl.pathname

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // Check if current route is admin-only
  const isAdminOnlyRoute = adminOnlyRoutes.some((route) => path.startsWith(route))

  // Check if current route is staff-only
  const isStaffOnlyRoute = staffOnlyRoutes.some((route) => path.startsWith(route))

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

  // If accessing role-specific routes, check user role
  if (payloadToken && (isAdminOnlyRoute || isStaffOnlyRoute)) {
    const userRole = await getUserRole(payloadToken)

    if (!userRole) {
      // Invalid token, redirect to login
      console.log('No User Role', path)

      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }

    // Check admin-only routes
    if (isAdminOnlyRoute && userRole !== 'admin') {
      console.log('Admin Only Route', path)

      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Check staff-only routes (staff and admin can access)
    if (isStaffOnlyRoute && userRole !== 'staff' && userRole !== 'admin') {
      console.log('Staff only Route', path)

      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // If accessing public route with valid token, optionally redirect to dashboard
  if (isPublicRoute && payloadToken && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
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
  // runtime: 'nodejs',
}
