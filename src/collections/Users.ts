import { authenticated, isAdmin, isStaff } from '@/authentication/isAuth'
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: isStaff,
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
      defaultValue: 'user',
      admin: {
        condition: (data, siblingData, { blockData, path, user }) => {
          return !!user
        },
      },
    },
  ],
}
