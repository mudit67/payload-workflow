import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params
    const token = request.cookies.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get current user
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
    if (user.role === 'user') {
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

// Updated PATCH method for step status changes
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayload({ config })
    const { id } = await params
    const token = request.cookies.get('payload-token')?.value
    const body = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get current user
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

    // Only admin/staff can update workflow status
    if (user.role !== 'admin' && user.role !== 'staff') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { stepId, stepStatus } = body

    if (!stepId || !stepStatus) {
      return NextResponse.json(
        {
          error: 'Step ID and step status are required',
        },
        { status: 400 },
      )
    }

    // Validate step status
    if (!['approved', 'rejected', 'pending'].includes(stepStatus)) {
      return NextResponse.json(
        {
          error: 'Invalid step status. Must be approved, rejected, or pending',
        },
        { status: 400 },
      )
    }

    // Get the workflow for posts collection
    const postsWorkflow = await payload.find({
      collection: 'workflows',
      where: {
        collection_name: { equals: 'posts' },
      },
      limit: 1,
    })

    if (postsWorkflow.docs.length === 0) {
      return NextResponse.json(
        {
          error: 'No workflow found for posts collection',
        },
        { status: 404 },
      )
    }

    const workflow = postsWorkflow.docs[0]

    // Validate step ID exists in workflow
    // const stepIndex = parseInt(stepId)
    // if (workflow && workflow.steps && (stepIndex < 0 || stepIndex >= workflow.steps.length)) {
    //   return NextResponse.json(
    //     {
    //       error: 'Invalid step ID',
    //     },
    //     { status: 400 },
    //   )
    // }

    const stepIndex = workflow.steps?.findIndex((step) => step.id == stepId)
    // Check if workflow status already exists for this document and step
    const existingStatus = await payload.find({
      collection: 'workflowStatus',
      where: {
        and: [
          { workflow_id: { equals: workflow.id } },
          { doc_id: { equals: id } },
          { step_id: { equals: stepId } },
        ],
      },
      limit: 1,
    })

    let updatedStatus
    if (existingStatus.docs.length > 0) {
      // Update existing workflow status
      updatedStatus = await payload.update({
        collection: 'workflowStatus',
        id: existingStatus.docs[0].id,
        data: {
          step_status: stepStatus,
        },
      })
    } else {
      // Create new workflow status
      updatedStatus = await payload.create({
        collection: 'workflowStatus',
        data: {
          workflow_id: workflow.id,
          doc_id: id,
          step_id: stepId,
          step_status: stepStatus,
        },
      })
    }

    const stepName = workflow.steps[stepIndex]?.step_name || null

    return NextResponse.json({
      success: true,
      workflowStatus: updatedStatus,
      stepName: stepName,
      message: `Step "${stepName}" status updated to "${stepStatus}"`,
    })
  } catch (error) {
    console.error('Error updating workflow status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
