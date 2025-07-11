import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NextApiRequest } from 'next'
import getUserRole from '@/lib/getUserRole'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // const id = request.url.substring(request.url.lastIndexOf('/') + 1)
  const { id } = await params
  // console.log(id)
  try {
    // const { id } = request.
    const payload = await getPayload({ config })
    // const { id } = await params
    const token = request.cookies.get('payload-token')?.value
    // console.log(request.cookies)
    console.log(token)

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await getUserRole()

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get the post
    let post
    try {
      post = await payload.findByID({
        collection: 'posts',
        id,
      })
    } catch (error) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Role-based access control for users
    if (user.role && user.role === 'user') {
      // For users, check if ALL workflow steps are approved
      const isPostFullyApproved = await checkIfPostFullyApproved(payload, id)

      if (!isPostFullyApproved) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Return post without workflow data for regular users
      return NextResponse.json({
        post,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        workflow: null, // Don't send workflow data to regular users
        canAccess: true,
      })
    }

    // For admin/staff, get full workflow information
    const postsWorkflow = await payload.find({
      collection: 'workflows',
      where: {
        collection_name: {
          equals: 'posts',
        },
      },
      limit: 1,
    })

    let workflowData = null

    if (postsWorkflow.docs.length > 0) {
      const workflow = postsWorkflow.docs[0]

      // Get ALL workflow statuses for this post
      const workflowStatuses = await payload.find({
        collection: 'workflowStatus',
        where: {
          and: [{ workflow_id: { equals: workflow.id } }, { doc_id: { equals: id } }],
        },
        limit: 0, // Get all statuses
      })

      // Create step status mapping
      const currentStepStatuses = workflow.steps?.map((step: any) => {
        const stepStatus = workflowStatuses.docs.find((status: any) => status.step_id === step.id)

        return {
          step_id: stepStatus?.step_id,
          step_status: stepStatus?.step_status || 'pending',
          statusId: stepStatus?.id || null,
        }
      })

      workflowData = {
        id: workflow.id,
        name: workflow.name,
        steps: workflow.steps,
        currentStepStatuses,
      }
    }

    return NextResponse.json({
      post,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      workflow: workflowData, // Send full workflow data to admin/staff
      canAccess: true,
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to check if all workflow steps are approved
async function checkIfPostFullyApproved(payload: any, postId: string): Promise<boolean> {
  try {
    // Get the workflow for posts
    const postsWorkflow = await payload.find({
      collection: 'workflows',
      where: {
        collection_name: { equals: 'posts' },
      },
      limit: 1,
    })

    if (postsWorkflow.docs.length === 0) {
      return false // No workflow means no access for users
    }

    const workflow = postsWorkflow.docs[0]
    const totalSteps = workflow.steps.length

    // Get approved steps for this post
    const approvedStatuses = await payload.find({
      collection: 'workflowStatus',
      where: {
        and: [
          { workflow_id: { equals: workflow.id } },
          { doc_id: { equals: postId } },
          { step_status: { equals: 'approved' } },
        ],
      },
      limit: 0,
    })

    // Check if all steps are approved
    return approvedStatuses.docs.length === totalSteps
  } catch (error) {
    console.error('Error checking post approval status:', error)
    return false
  }
}
