import { isAdmin, isStaff, authenticated } from '@/authentication/isAuth'
import type { CollectionConfig } from 'payload'
import { bfReadHook } from './Workflow'

export const contracts: CollectionConfig = {
  slug: 'contracts',

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
  ],
}
