import { authenticated, isAdmin, isAnyone, isStaff } from '@/authentication/isAuth'
import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',

  access: {
    admin: isStaff,
    read: isStaff,
    create: isAnyone,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: 'text',
      name: 'name',
    },
    {
      type: 'number',
      name: 'price',
    },
    {
      name: 'desc',
      type: 'text',
    },
  ],
}
