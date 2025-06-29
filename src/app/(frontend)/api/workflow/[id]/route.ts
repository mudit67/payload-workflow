import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayload({ config })
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }

    // Delete the workflow
    await payload.delete({
      collection: 'workflows',
      id,
    })

    return NextResponse.json(
      { success: true, message: 'Workflow deleted successfully' },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error deleting workflow:', error)

    // Handle not found errors
    if (error.status === 404) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    // Handle access control errors
    if (error.message?.includes('access') || error.status === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete workflow' },
        { status: 403 },
      )
    }

    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
