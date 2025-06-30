import { authenticated, isAdmin, isStaff } from '@/authentication/isAuth'

import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

const aftChangeLog: CollectionAfterChangeHook = async ({ req, doc, previousDoc }) => {
  // console.log(operation)

  const workflow = await req.payload.findByID({ collection: 'workflows', id: doc.workflow_id.id })

  req.payload.create({
    collection: 'workflowLogs',
    data: {
      initiator: workflow.steps?.filter((step) => step.id == doc.step_id)[0].assigned_to,
      collectionAffected: workflow.collection_name,
      documentAffected: doc.doc_id,
      prevStatus: previousDoc.step_status,
      curStatus: doc.step_status,
    },
  })
}

export const WorkflowStatus: CollectionConfig = {
  slug: 'workflowStatus',
  access: {
    admin: isAdmin,
    read: authenticated,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
    unlock: isStaff,
  },
  fields: [
    {
      name: 'workflow_id',
      type: 'relationship',
      relationTo: 'workflows',
      // required: true,
    },
    {
      name: 'doc_id',
      type: 'text',
    },
    {
      name: 'step_id',
      type: 'text',
    },
    {
      name: 'step_status',
      type: 'radio',
      options: ['approved', 'rejected', 'pending'],
    },
  ],
  hooks: {
    afterChange: [aftChangeLog],
  },
  timestamps: true,
}
