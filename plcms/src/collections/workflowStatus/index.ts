import type { CollectionConfig } from 'payload'

// import { authentigcated } from '../../access/authenticated'

export const WorkflowStatus: CollectionConfig = {
  slug: 'workflowStatus',
  fields: [
    {
      name: 'workflow_id',
      type: 'relationship',
      relationTo: 'workflows',
      unique: true,
    },
    {
      name: 'current_step',
      type: 'text',
    },
  ],
  timestamps: true,
}
