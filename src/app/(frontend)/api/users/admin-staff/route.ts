import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const token = request.cookies.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get current user to verify permissions
    let currentUser
    try {
      const userResponse = await fetch(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/users/me`,
        {
          headers: {
            Cookie: `payload-token=${token}`,
          },
        },
      )

      if (!userResponse.ok) {
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
      }

      const userData = await userResponse.json()
      currentUser = userData.user
    } catch (error) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Only admin users can fetch user lists
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch admin and staff users
    const users = await payload.find({
      collection: 'users',
      where: {
        role: {
          in: ['admin', 'staff'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      limit: 100,
      sort: 'name',
    })

    return NextResponse.json({
      users: users.docs,
    })
  } catch (error) {
    console.error('Error fetching admin/staff users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
