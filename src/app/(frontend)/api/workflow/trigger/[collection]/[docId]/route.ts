import { NextRequest, NextResponse } from 'next/server'

import getUserRole from '@/lib/getUserRole'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string; docId: string }> },
) {
  const { collection, docId } = await params

  // console.log(collection, docId)
  const body = await req.json()
  //   console.log(body)
  if (!body.step_id || !body.step_status) {
    return NextResponse.json(
      {
        error: 'Step ID and step status are required',
      },
      { status: 400 },
    )
  }
  if (!['approved', 'rejected', 'pending'].includes(body.step_status)) {
    return NextResponse.json(
      {
        error: 'Invalid Step Status',
      },
      { status: 400 },
    )
  }

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
  const step = workflow.docs[0].steps?.find((step) => step.id == body.step_id)
  if (!step) {
    console.error(body.step_id, workflow.docs)

    return NextResponse.json(
      {
        error: 'Step ID not found',
      },
      { status: 400 },
    )
  }

  let assigned_to
  if (typeof step?.assigned_to == 'number') {
    assigned_to = step?.assigned_to
  } else if (typeof step?.assigned_to == 'object') {
    assigned_to = step?.assigned_to?.id
  }

  if (user.role != 'admin' && assigned_to != user.id) {
    return NextResponse.json({ error: 'This Step was not assigned to you' }, { status: 403 })
  }

  const status = await payload.find({
    collection: 'workflowStatus',
    where: {
      workflow_id: { equals: workflow.docs[0].id },
      doc_id: { equals: docId },
      step_id: { equals: body.step_id },
    },
  })

  if (status.docs[0].step_status == body.step_status) {
    return NextResponse.json(
      { message: `The Status is already ${body.step_status}` },
      { status: 200 },
    )
  }

  const update = await payload.update({
    collection: 'workflowStatus',
    where: { step_id: { equals: step.id }, doc_id: { equals: docId } },
    data: { step_status: body.step_status },
    user: user.id,
  })

  return NextResponse.json({
    message: `The Status was updated from ${status.docs[0].step_status} to ${update.docs[0].step_status}`,
  })
}
