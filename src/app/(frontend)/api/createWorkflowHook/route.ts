import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { WorkflowEngine } from '@/lib/workflowEngine'
import { registerWorkflowHook } from '@/lib/registerWorkflowHook'
import getUserRole from '@/lib/getUserRole'

export async function POST(request: NextRequest) {
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

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create workflow hooks' }, { status: 403 })
    }

    const { workflowId, collectionName, workflowData } = body

    if (!workflowId || !collectionName) {
      return NextResponse.json(
        {
          error: 'Workflow ID and collection name are required',
        },
        { status: 400 },
      )
    }

    // Verify the workflow exists
    const workflow = await payload.findByID({
      collection: 'workflows',
      id: workflowId,
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Check if target collection exists
    const targetCollection = payload.config.collections.find((col) => col.slug === collectionName)

    if (!targetCollection) {
      return NextResponse.json(
        {
          error: `Collection '${collectionName}' not found`,
        },
        { status: 400 },
      )
    }

    // Register the workflow hook
    await registerWorkflowHook(payload, collectionName, workflowId)

    // Optionally process existing documents
    const processExisting = body.processExistingDocuments || false
    if (processExisting) {
      const workflowEngine = new WorkflowEngine(payload)
      // Run this in background to avoid timeout
      setImmediate(async () => {
        try {
          await workflowEngine.processExistingDocuments(collectionName, workflowId)
          console.log(`Finished processing existing documents for workflow ${workflowId}`)
        } catch (error) {
          console.error('Error processing existing documents:', error)
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Workflow hook registered for collection '${collectionName}'`,
      workflowId: workflowId,
      collectionName: collectionName,
    })
  } catch (error) {
    console.error('Error creating workflow hook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
