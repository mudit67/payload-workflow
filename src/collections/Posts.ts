import { isAdmin, isStaff, authenticated } from '@/authentication/isAuth'
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
  ],
}
