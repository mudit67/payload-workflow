import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import getUserRole from '@/lib/getUserRole'

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const token = request.cookies.get('payload-token')?.value
    const body = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await getUserRole()

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Check permissions (admin/staff only)
    if (user.role !== 'admin' && user.role !== 'staff') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { stepId, step_status } = body

    if (!stepId || !step_status) {
      return NextResponse.json(
        {
          error: 'stepId and step_status are required',
        },
        { status: 400 },
      )
    }

    // Validate step_status value
    if (!['approved', 'rejected', 'pending'].includes(step_status)) {
      return NextResponse.json(
        {
          error: 'Invalid step_status. Must be approved, rejected, or pending',
        },
        { status: 400 },
      )
    }

    // Get the current workflow status document to verify it exists
    let currentStatus
    try {
      currentStatus = await payload.findByID({
        collection: 'workflowStatus',
        id: stepId,
      })
    } catch (error) {
      return NextResponse.json({ error: 'Workflow status not found' }, { status: 404 })
    }

    // Update the workflow status
    const updatedStatus = await payload.update({
      collection: 'workflowStatus',
      id: stepId,
      data: {
        step_status,
      },
    })

    return NextResponse.json({
      success: true,
      workflowStatus: updatedStatus,
      message: `Step status updated to "${step_status}"`,
    })
  } catch (error) {
    console.error('Error updating workflow step status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
