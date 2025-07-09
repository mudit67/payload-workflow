import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import getUserRole from '@/lib/getUserRole'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const token = request.cookies.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await getUserRole()

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Only admin users can fetch user lists
    if (user.role !== 'admin') {
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
