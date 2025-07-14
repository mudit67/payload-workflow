import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import getUserRole from '@/lib/getUserRole'

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const id = request.url.substring(request.url.lastIndexOf('/') + 1)
    const token = request.cookies.get('payload-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await getUserRole()

    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete workflows' }, { status: 403 })
    }

    // Get the workflow first to know which collection it was associated with
    const workflow = await payload.findByID({
      collection: 'workflows',
      id,
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Remove the hook from the target collection
    await removeWorkflowHook(payload, workflow.collection_name, id)

    // Also clean up any workflow status records for this workflow
    await payload.delete({
      collection: 'workflowStatus',
      where: {
        workflow_id: { equals: id },
      },
    })

    // Delete the workflow document
    await payload.delete({
      collection: 'workflows',
      id,
    })

    return NextResponse.json(
      {
        success: true,
        message: `Workflow "${workflow.name}" and associated hook deleted successfully`,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error deleting workflow:', error)

    if (error.status === 404) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    if (error.message?.includes('access') || error.status === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete workflow' },
        { status: 403 },
      )
    }

    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}

async function removeWorkflowHook(payload: any, collectionSlug: string, workflowId: string) {
  try {
    // Find the target collection
    const targetCollection = payload.config.collections.find(
      (col: any) => col.slug === collectionSlug,
    )

    if (!targetCollection) {
      console.warn(`Collection ${collectionSlug} not found for hook removal`)
      return
    }

    // Check if hooks exist
    if (!targetCollection.hooks || !targetCollection.hooks.afterChange) {
      console.warn(`No afterChange hooks found in collection ${collectionSlug}`)
      return
    }

    // Filter out the specific workflow hook
    const originalHookCount = targetCollection.hooks.afterChange.length
    targetCollection.hooks.afterChange = targetCollection.hooks.afterChange.filter(
      (hook: any) => hook.name !== `workflow-${workflowId}`,
    )

    const removedHooks = originalHookCount - targetCollection.hooks.afterChange.length

    if (removedHooks > 0) {
      console.log(
        `Removed ${removedHooks} workflow hook(s) for workflow ${workflowId} from collection ${collectionSlug}`,
      )
    } else {
      console.warn(
        `No workflow hook found with name workflow-${workflowId} in collection ${collectionSlug}`,
      )
    }
  } catch (error) {
    console.error(`Error removing workflow hook for workflow ${workflowId}:`, error)
  }
}
