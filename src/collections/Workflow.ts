import { isAdmin, isStaff } from '@/authentication/isAuth'
import type { CollectionConfig } from 'payload'

// import { authentigcated } from '../../access/authenticated'

export const Workflows: CollectionConfig = {
  slug: 'workflows',
  access: {
    admin: isAdmin,
    read: isStaff,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    unlock: isAdmin,
  },

  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'collection_name',
      unique: true,
      type: 'text',
    },
    {
      name: 'steps',
      type: 'array',
      fields: [
        { name: 'step_name', type: 'text' },
        {
          type: 'select',
          name: 'type',
          options: ['approval', 'review', 'sign-off', 'comment-only'],
        },
      ],
    },
  ],
  timestamps: true,
}
