import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface WorkflowStatus {
  id: string
  workflow_id: any
  doc_id: string
  current_step: string
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const token = request.cookies.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get current user using Payload's REST API approach
    let user
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
      user = userData.user
    } catch (error) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    let posts = []

    if (user.role === 'user') {
      // For regular users, only show posts in comment-only workflow steps
      posts = await getCommentOnlyPosts(payload)
    } else if (user.role === 'admin' || user.role === 'staff') {
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
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get posts that are in comment-only workflow steps
async function getCommentOnlyPosts(payload: any) {
  try {
    // First, get all workflows to find which ones have comment-only steps
    const workflows = await payload.find({
      collection: 'workflows',
      limit: 0, // Get all workflows
    })

    // Find workflows that have comment-only steps and get their step names
    const commentOnlyWorkflowSteps: { workflowId: string; stepName: string }[] = []

    workflows.docs.forEach((workflow: any) => {
      workflow.steps.forEach((step: any) => {
        if (step.type === 'comment-only') {
          commentOnlyWorkflowSteps.push({
            workflowId: workflow.id,
            stepName: step.step_name,
          })
        }
      })
    })

    if (commentOnlyWorkflowSteps.length === 0) {
      return []
    }

    // Get workflow statuses for posts that are in comment-only steps
    const workflowStatuses = await payload.find({
      collection: 'workflowStatus',
      where: {
        and: [
          {
            workflow_id: {
              in: commentOnlyWorkflowSteps.map((w) => w.workflowId),
            },
          },
          {
            current_step: {
              in: commentOnlyWorkflowSteps.map((w) => w.stepName),
            },
          },
        ],
      },
      limit: 0,
    })

    if (workflowStatuses.docs.length === 0) {
      return []
    }

    // Get the actual posts using the doc_ids from workflow statuses
    const postIds = workflowStatuses.docs.map((status: WorkflowStatus) => status.doc_id)

    const posts = await payload.find({
      collection: 'posts',
      where: {
        id: {
          in: postIds,
        },
      },
      limit: 50,
      sort: '-createdAt',
    })

    return posts.docs
  } catch (error) {
    console.error('Error fetching comment-only posts:', error)
    return []
  }
}
