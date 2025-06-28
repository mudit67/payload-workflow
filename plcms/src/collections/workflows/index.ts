import type { CollectionConfig } from 'payload'

// import { authenticated } from '../../access/authenticated'

export const Workflows: CollectionConfig = {
  slug: 'workflows',
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'collection_name',
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
