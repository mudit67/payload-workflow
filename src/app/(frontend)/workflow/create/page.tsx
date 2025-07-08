import { getPayload } from 'payload'
import configPromise from '@payload-config'
import CreateWorkflowClient from '../CreateWorkflowClient'

import './../workflow.css'

interface Collection {
  slug: string
  labels: {
    singular: string
    plural: string
  }
  fields: Array<{
    name: string
    type: string
  }>
}

export const revalidate = 0

export default async function CreateWorkflowPage() {
  // This runs on the server
  const payload = await getPayload({ config: configPromise })

  // Get collections server-side with their fields
  const allCollections: Collection[] = payload.config.collections.map((collection) => {
    const tempCol: Collection = {
      slug: collection.slug,
      labels: { singular: collection.slug, plural: collection.slug },
      fields: collection.fields
        .map((field: any) => ({
          name: field.name,
          type: field.type,
        }))
        .filter((field: any) => field.name && field.name !== 'id'),
    }
    return tempCol
  })
  //   ({
  //   slug: collection.slug,
  //   labels: collection.labels || { singular: collection.slug, plural: collection.slug },
  //   fields: collection.fields
  //     .map((field: any) => ({
  //       name: field.name,
  //       type: field.type,
  //     }))
  //     .filter((field: any) => field.name && field.name !== 'id'),
  // }))

  // Filter out system collections
  const filteredCollections = allCollections.filter(
    (col: Collection) =>
      col &&
      col.slug &&
      ![
        'users',
        'workflows',
        'workflow-logs',
        'payload-preferences',
        'payload-migrations',
        'workflowStatus',
        'payload-locked-documents',
      ].includes(col.slug),
  )

  // Get existing workflows to find which collections already have workflows
  const existingWorkflows = await payload.find({
    collection: 'workflows',
    limit: 0, // Get all workflows without pagination
    select: {
      collection_name: true,
    },
  })

  // Extract collection names that already have workflows
  const existingWorkflowCollections = existingWorkflows.docs.map(
    (workflow: any) => workflow.collection_name,
  )

  // Filter out collections that already have workflows
  const availableCollections = filteredCollections.filter(
    (col: Collection) => !existingWorkflowCollections.includes(col.slug),
  )

  // Pass available collections to client component
  return <CreateWorkflowClient collections={availableCollections} />
}
