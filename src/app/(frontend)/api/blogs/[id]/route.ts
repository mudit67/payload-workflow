import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'

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

    if (post) {
      console.log(post.content)
      // convertLexicalToPlaintext({ data: post.content })
    }

    // Get workflow information for posts collection
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
    let currentWorkflowStatus = null

    if (postsWorkflow.docs.length > 0) {
      const workflow = postsWorkflow.docs[0]

      // Get current workflow status for this post
      const workflowStatus = await payload.find({
        collection: 'workflowStatus',
        where: {
          doc_id: {
            equals: id,
          },
        },
        limit: 1,
      })

      currentWorkflowStatus = workflowStatus.docs.length > 0 ? workflowStatus.docs[0] : null

      workflowData = {
        id: workflow.id,
        name: workflow.name,
        steps: workflow.steps,
        currentStep: currentWorkflowStatus?.current_step || null,
        statusId: currentWorkflowStatus?.id || null,
      }
    }

    // Role-based access control
    if (user.role === 'user') {
      // Check if post is in comment-only workflow step
      if (!currentWorkflowStatus) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const currentStep = workflowData?.steps.find(
        (s: any) => s.step_name === currentWorkflowStatus.current_step,
      )

      if (!currentStep || currentStep.type !== 'comment-only') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json({
      post,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      workflow: workflowData,
      canAccess: true,
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add PATCH method to update workflow status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayload({ config })
    const { id } = params
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

    const { workflowStep, statusId } = body

    if (!workflowStep) {
      return NextResponse.json({ error: 'Workflow step is required' }, { status: 400 })
    }

    // Get the workflow for posts collection
    const postsWorkflow = await payload.find({
      collection: 'workflows',
      where: {
        collection_name: {
          equals: 'posts',
        },
      },
      limit: 1,
    })

    if (postsWorkflow.docs.length === 0) {
      return NextResponse.json({ error: 'No workflow found for posts collection' }, { status: 404 })
    }

    const workflow = postsWorkflow.docs[0]

    console.log('Workflow: ', workflow)

    // Validate that the step exists in the workflow
    const stepExists = workflow.steps.some((step: any) => step.step_name === workflowStep)
    if (!stepExists) {
      return NextResponse.json({ error: 'Invalid workflow step' }, { status: 400 })
    }

    let updatedStatus
    if (statusId) {
      // Update existing workflow status
      updatedStatus = await payload.update({
        collection: 'workflowStatus',
        id: statusId,
        data: {
          current_step: workflowStep,
        },
      })
    } else {
      // Create new workflow status
      updatedStatus = await payload.create({
        collection: 'workflowStatus',
        data: {
          workflow_id: workflow.id,
          doc_id: id,
          current_step: workflowStep,
        },
      })
    }

    return NextResponse.json({
      success: true,
      workflowStatus: updatedStatus,
      message: `Workflow status updated to "${workflowStep}"`,
    })
  } catch (error) {
    console.error('Error updating workflow status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
