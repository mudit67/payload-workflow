import getUserRole from '@/lib/getUserRole'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'
import { stat } from 'fs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string; docId: string }> },
) {
  const { collection, docId } = await params

  // console.log(collection, docId)

  const payload = await getPayload({ config })

  const token = req.cookies.get('payload-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const user = await getUserRole()
  if (!user) {
    return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
  }

  if (user.role && user.role != 'admin' && user.role != 'staff') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const workflow = await payload.find({
    collection: 'workflows',
    where: {
      collection_name: { equals: collection },
    },
  })
  if (workflow.docs.length === 0) {
    return NextResponse.json(
      {
        error: `No workflow found for ${collection} collection`,
      },
      { status: 404 },
    )
  }

  const status = await payload.find({
    collection: 'workflowStatus',
    where: {
      workflow_id: { equals: workflow.docs[0].id },
      doc_id: { equals: docId },
    },
  })

  const stepStatuses: any[] = []

  status.docs.forEach((statusDoc) => {
    if (workflow.docs[0].steps && statusDoc.step_id) {
      const step = workflow.docs[0].steps.find((step) => step.id == statusDoc.step_id)
      let assigned_to
      if (typeof step?.assigned_to == 'number') {
        assigned_to = step?.assigned_to
      } else if (typeof step?.assigned_to == 'object') {
        assigned_to = step?.assigned_to?.name
      }
      stepStatuses.push({
        id: step?.id,
        name: step?.step_name,
        type: step?.type,
        assigned_to: assigned_to,
        field_name: step?.field_name,
        operator: step?.operator,
        desired_value: step?.desiredValue,
        current_status: statusDoc.step_status,
      })
    }
    // statusDoc.step_id
  })

  return NextResponse.json(stepStatuses)
}
