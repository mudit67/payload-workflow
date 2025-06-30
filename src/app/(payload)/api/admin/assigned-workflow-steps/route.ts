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

    // Only allow admin/staff
    if (user.role !== 'admin' && user.role !== 'staff') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all workflows where user is assigned
    const workflows = await payload.find({
      collection: 'workflows',
      limit: 0,
    })

    const assignedSteps: any[] = []

    for (const workflow of workflows.docs) {
      if (!workflow.steps) {
        continue
      }
      // Check each step to see if user is assigned

      //   console.log(workflow)

      for (let stepIndex = 0; stepIndex < workflow.steps.length; stepIndex++) {
        const step = workflow.steps[stepIndex]
        // console.log(user.id)
        // console.log(step.assigned_to)

        // Check if user is assigned to this step
        const isAssigned =
          step.assigned_to &&
          (typeof step.assigned_to === 'object'
            ? step.assigned_to.id === user.id
            : step.assigned_to === user.id)

        // console.log(isAssigned)
        if (isAssigned) {
          // Get workflow statuses for this step

          const workflowStatuses = await payload.find({
            collection: 'workflowStatus',
            where: {
              and: [{ workflow_id: { equals: workflow.id } }, { step_id: { equals: step.id } }],
            },
            limit: 0,
          })

          // Add each document that has this step
          for (const status of workflowStatuses.docs) {
            assignedSteps.push({
              id: status.id,
              step_name: step.step_name,
              type: step.type,
              step_status: status.step_status,
              workflow_name: workflow.name,
              doc_id: status.doc_id,
              collection_name: workflow.collection_name,
              assigned_to: step.assigned_to,
            })
          }
        }
      }
    }
    // console.log(assignedSteps)

    return NextResponse.json({
      assignedSteps: assignedSteps,
    })
  } catch (error) {
    console.error('Error fetching assigned workflow steps:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
