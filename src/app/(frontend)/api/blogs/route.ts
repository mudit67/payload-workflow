import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

interface WorkflowStatus {
  id: string
  workflow_id: any
  doc_id: string
  step_id: string
  step_status: string
}

interface User {
  id: number
  email: string
  role: string
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const headersList = await headers()
    const user = await payload
      .auth({ headers: headersList, canSetHeaders: false })
      .then((authRes) => {
        if (!authRes.user) return null
        const user: User = {
          role: authRes.user.role || '',
          email: authRes.user.email,
          id: authRes.user.id,
        }
        return user
      })
      .catch(() => {
        console.error('Authentication failed')

        return null
      })

    console.log(user && user.role)

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // // Get current user using Payload's REST API approach
    // let user
    // try {
    //   const userResponse = await fetch(
    //     `${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/users/me`,
    //     {
    //       headers: {
    //         Cookie: `payload-token=${token}`,
    //       },
    //     },
    //   )

    //   if (!userResponse.ok) {
    //     return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    //   }

    //   const userData = await userResponse.json()
    //   user = userData.user
    // } catch (error) {
    //   return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    // }

    let posts = []

    if (user.role && user.role === 'user') {
      // For regular users, only show posts where all workflow steps are approved
      posts = await getPostsWithAllStepsApproved(payload)
    } else if (user && (user.role === 'admin' || user.role === 'staff')) {
      // For admin/staff, show all posts
      const allPosts = await payload.find({
        collection: 'posts',
        limit: 50,
        sort: '-createdAt',
      })
      posts = allPosts.docs
    }

    return NextResponse.json({
      posts,
      user: {
        id: user ? user.id : null,
        email: user ? user.email : null,
        role: user ? user.role : null,
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get posts where all workflow steps are approved
async function getPostsWithAllStepsApproved(payload: any) {
  try {
    // Get all workflows
    const workflows = await payload.find({
      collection: 'workflows',
      limit: 0,
    })

    if (workflows.docs.length === 0) {
      return []
    }

    // For each workflow, get all posts where all steps are approved
    const approvedPostIdsSet = new Set()

    for (const workflow of workflows.docs) {
      // Get all steps count
      const totalSteps = workflow.steps.length

      // Get workflowStatus grouped by doc_id where all steps are approved
      const workflowStatuses = await payload.find({
        collection: 'workflowStatus',
        where: {
          workflow_id: { equals: workflow.id },
          step_status: { equals: 'approved' },
        },
        limit: 0,
      })

      // Count approved steps per doc_id
      const approvedStepsCount: Record<string, number> = {}
      workflowStatuses.docs.forEach((status: any) => {
        approvedStepsCount[status.doc_id] = (approvedStepsCount[status.doc_id] || 0) + 1
      })

      // Add doc_ids where approved steps count equals total steps
      for (const [docId, count] of Object.entries(approvedStepsCount)) {
        if (count === totalSteps) {
          approvedPostIdsSet.add(docId)
        }
      }
    }

    if (approvedPostIdsSet.size === 0) {
      return []
    }

    // Fetch posts with approved workflow
    const posts = await payload.find({
      collection: 'posts',
      where: {
        id: {
          in: Array.from(approvedPostIdsSet),
        },
      },
      limit: 50,
      sort: '-createdAt',
    })

    return posts.docs
  } catch (error) {
    console.error('Error fetching posts with all steps approved:', error)
    return []
  }
}
