import { isAdmin, isStaff } from '@/authentication/isAuth'
import { registerWorkflowHook } from '@/lib/registerWorkflowHook'
import type {
  CollectionBeforeDeleteHook,
  CollectionBeforeReadHook,
  CollectionConfig,
  Where,
} from 'payload'
// import type { CollectionAfterLoginHook } from 'payload'

// import { authentigcated } from '../../access/authenticated'

// const aftLoginHook: CollectionAfterLoginHook = async ({ req }) => {
//   console.log('After Login Hook Called')

//   const registeredWorkflows = await req.payload.find({ collection: 'workflows' })
//   registeredWorkflows.docs.map((wf) => {
//     if (wf.collection_name) {
//       registerWorkflowHook(req.payload, wf.collection_name, wf.id)
//     }
//   })
// }

export const bfReadHook: CollectionBeforeReadHook = async ({ req }) => {
  console.log('Before Read Hook Called')
  const registeredWorkflows = await req.payload.find({ collection: 'workflows' })
  console.log(registerWorkflowHook)

  registeredWorkflows.docs.map((wf) => {
    if (wf.collection_name) {
      registerWorkflowHook(req.payload, wf.collection_name, wf.id)
    }
  })
}

export const bfDelHook: CollectionBeforeDeleteHook = async ({ req, id: wfId }) => {
  // const wfId = doc.id
  const query: Where = {
    or: [
      {
        workflow_id: {
          equals: wfId || 0,
        },
      },
      {
        workflow_id: {
          equals: 0,
        },
      },
    ],
  }
  wfId = Number(wfId)
  req.payload.delete({
    collection: 'workflowStatus',
    where: query,
  })
}

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
      required: true,
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
        {
          type: 'relationship',
          relationTo: 'users',
          name: 'assigned_to',
        },
        {
          name: 'field_name',
          type: 'text',
        },
        {
          type: 'select',
          name: 'operator',
          options: [
            { label: 'Text Length Equals', value: 'text:length:equals' },
            { label: 'Text Length >=', value: 'text:length:greaterThanEqualsTo' },
            { label: 'Text Length <=', value: 'text:length:lessThanEqualsTo' },
            { label: 'Text Length >', value: 'text:length:greaterThan' },
            { label: 'Text Length <', value: 'text:length:lessThan' },
            { label: 'Text Starts With', value: 'text:startsWith' },
            { label: 'Text Ends With', value: 'text:endsWith' },
            { label: 'Text Contains', value: 'text:contains' },
            { label: 'Number Equals', value: 'number:equals' },
            { label: 'Number >=', value: 'number:greaterThanEqualsTo' },
            { label: 'Number <=', value: 'number:lessThanEqualsTo' },
            { label: 'Number >', value: 'number:greaterThan' },
            { label: 'Number <', value: 'number:lessThan' },
            { label: 'Checkbox Equals', value: 'checkBox:equals' },
            { label: 'Date Equals', value: 'date:equals' },
            { label: 'Date >=', value: 'date:greaterThanEqualsTo' },
            { label: 'Date <=', value: 'date:lessThanEqualsTo' },
            { label: 'Date >', value: 'date:greaterThan' },
            { label: 'Date <', value: 'date:lessThan' },
          ],
        },
        {
          name: 'desiredValue',
          type: 'text',
        },
      ],
    },
  ],
  hooks: {
    // afterLogin: [aftLoginHook],
    // beforeRead: [bfReadHook],
    beforeDelete: [bfDelHook],
  },
  timestamps: true,
}
