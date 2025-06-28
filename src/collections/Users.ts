import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      type: 'text',
      name: 'name',
    },
    {
      type: 'select',
      name: 'role',
      options: ['admin', 'staff', 'user'],
      admin: {
        condition: (data, siblingData, { blockData, path, user }) => {
          return !!user
        },
      },
    },
  ],
}
