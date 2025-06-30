import { authenticated, isAdmin, isAnyone, isStaff } from '@/authentication/isAuth'
import type { CollectionConfig } from 'payload'
import { aftMe, bfReadHook } from './Workflow'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: isStaff,
    create: isAnyone,
    update: isAdmin,
    delete: isAdmin,
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
  hooks: {
    beforeLogin: [bfReadHook],
    afterMe: [aftMe],
  },
}
