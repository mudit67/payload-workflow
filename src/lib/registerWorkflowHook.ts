import { WorkflowEngine } from './workflowEngine'

export async function registerWorkflowHook(
  payload: any,
  collectionSlug: string,
  workflowId: number,
) {
  // Find the target collection
  const targetCollection = payload.config.collections.find(
    (col: any) => col.slug === collectionSlug,
  )

  if (!targetCollection) {
    throw new Error(`Collection ${collectionSlug} not found`)
  }

  // Initialize hooks if they don't exist
  if (!targetCollection.hooks) {
    targetCollection.hooks = {}
  }

  if (!targetCollection.hooks.afterChange) {
    targetCollection.hooks.afterChange = []
  }

  // Create the workflow hook function
  const workflowHook = async ({ doc, req, operation }: any) => {
    if (operation === 'create' || operation === 'update') {
      try {
        const workflowEngine = new WorkflowEngine(req.payload)
        await workflowEngine.processDocument(collectionSlug, doc.id, doc, workflowId)
      } catch (error) {
        console.error(`Error in workflow hook for ${collectionSlug}:`, error)
      }
    }
  }

  // Check if hook already exists to avoid duplicates
  const existingHookIndex = targetCollection.hooks.afterChange.findIndex(
    (hook: any) => hook.name === `workflow-${workflowId}`,
  )

  if (existingHookIndex === -1) {
    // Add name property for identification
    Object.defineProperty(workflowHook, 'name', {
      value: `workflow-${workflowId}`,
      writable: false,
    })

    targetCollection.hooks.afterChange.push(workflowHook)
    console.log(
      `Workflow hook registered for collection: ${collectionSlug}, workflow: ${workflowId}`,
    )
  } else {
    console.log(
      `Workflow hook already exists for collection: ${collectionSlug}, workflow: ${workflowId}`,
    )
  }
}
