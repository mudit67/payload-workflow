import { authenticated, isAdmin, isStaff } from '@/authentication/isAuth'
import { User } from '@/payload-types'
import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

const aftChangeLog: CollectionAfterChangeHook = async ({ req, doc, previousDoc }) => {
  // console.log(operation)
  if (previousDoc.step_status != doc.step_status) {
    const workflow = await req.payload.findByID({ collection: 'workflows', id: doc.workflow_id.id })
    // console.log(req.user)
    const engineUser: User = {
      id: 0,
      email: 'Workflow@Engine',
      name: 'WorkflowEngine',
      updatedAt: '01-01-2000',
      createdAt: '01-01-2000',
    }
    req.payload.create({
      collection: 'workflowLogs',
      data: {
        initiator: req.user ? req.user : 0,
        collectionAffected: workflow.collection_name,
        documentAffected: doc.doc_id,
        prevStatus: previousDoc.step_status,
        curStatus: doc.step_status,
      },
    })
  }
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
