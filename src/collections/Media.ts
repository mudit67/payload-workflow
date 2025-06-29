import { authenticated, isAdmin, isStaff } from '@/authentication/isAuth'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
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
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
