import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import getUserRole from '@/lib/getUserRole'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const user = await getUserRole()

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate required fields
    if (!body.name || !body.collection_name || !body.steps) {
      return NextResponse.json(
        { error: 'Missing required fields: name, collection_name, and steps are required' },
        { status: 400 },
      )
    }

    // Validate minimum steps requirement
    if (!Array.isArray(body.steps) || body.steps.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 steps are required in the workflow' },
        { status: 400 },
      )
    }

    // Validate each step has required fields
    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i]
      if (!step.step_name || !step.type) {
        return NextResponse.json(
          { error: `Step ${i + 1} is missing required fields: step_name and type` },
          { status: 400 },
        )
      }

      // Validate step type
      const validTypes = ['approval', 'review', 'sign-off', 'comment-only']
      if (!validTypes.includes(step.type)) {
        return NextResponse.json(
          { error: `Step ${i + 1} has invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 },
        )
      }
    }

    // Create the workflow document
    const workflow = await payload.create({
      collection: 'workflows',
      data: {
        name: body.name,
        collection_name: body.collection_name,
        steps: body.steps,
      },
    })

    return NextResponse.json(
      {
        success: true,
        workflow,
        message: 'Workflow created successfully',
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error('Error creating workflow:', error)

    // Handle unique constraint violation for collection_name
    if (error.message?.includes('unique') || error.code === '23505') {
      return NextResponse.json(
        { error: 'A workflow with this collection_name already exists' },
        { status: 409 },
      )
    }

    // Handle access control errors
    if (error.message?.includes('access') || error.status === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create workflow' },
        { status: 403 },
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
