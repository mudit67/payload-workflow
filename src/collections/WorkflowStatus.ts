import { authenticated, isAdmin, isStaff } from '@/authentication/isAuth'

import type { CollectionConfig } from 'payload'

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
    },
    {
      name: 'doc_id',
      type: 'text',
    },
    {
      name: 'current_step',
      type: 'text',
    },
  ],
  timestamps: true,
}
