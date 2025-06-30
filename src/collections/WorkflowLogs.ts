import { authenticated, isAdmin, isStaff, noOne } from '@/authentication/isAuth'

import type { CollectionConfig } from 'payload'

export const WorkflowLogs: CollectionConfig = {
  slug: 'workflowLogs',
  access: {
    // admin: isAdmin,
    read: isStaff,
    create: isStaff,
    update: noOne,
    delete: noOne,
    unlock: noOne,
  },
  fields: [
    {
      name: 'initiator',
      relationTo: 'users',
      type: 'relationship',
    },
    {
      name: 'collectionAffected',
      type: 'text',
    },
    {
      name: 'documentAffected',
      type: 'text',
    },
    {
      type: 'text',
      name: 'prevStatus',
    },

    {
      type: 'text',
      name: 'curStatus',
    },
  ],
  timestamps: true,
}
