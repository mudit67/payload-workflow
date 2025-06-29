import { getPayload } from 'payload'
import config from '@payload-config'
import { WorkflowCard } from './WorkflowCard'
import { CreateWorkflowButton } from './createWorkflowButton'

interface WorkflowStep {
  step_name: string
  type: 'approval' | 'review' | 'sign-off' | 'comment-only'
  id?: string
}

interface Workflow {
  id: string
  name: string
  collection_name: string
  steps: WorkflowStep[]
  createdAt: string
  updatedAt: string
}

export default async function WorkflowsPage() {
  const payload = await getPayload({ config })

  try {
    const workflows = await payload.find({
      collection: 'workflows',
      limit: 100,
      sort: '-createdAt',
    })

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
                <p className="mt-2 text-gray-600">Manage and view all workflow configurations</p>
              </div>
              <CreateWorkflowButton />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Workflows</dt>
                    <dd className="text-lg font-medium text-gray-900">{workflows.totalDocs}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Collections
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Set(workflows.docs.map((w: Workflow) => w.collection_name)).size}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Steps per Workflow
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {workflows.docs.length > 0
                        ? Math.round(
                            workflows.docs.reduce(
                              (acc: number, w: Workflow) => acc + w.steps.length,
                              0,
                            ) / workflows.docs.length,
                          )
                        : 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Workflows Grid */}
          {workflows.docs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.docs.map((workflow: Workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Workflows</h1>
          <p className="text-gray-600">Please try again later or contact support.</p>
        </div>
      </div>
    )
  }
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows</h3>
      <p className="mt-1 text-sm text-gray-500">Get started by creating a new workflow.</p>
      <div className="mt-6">
        <CreateWorkflowButton />
      </div>
    </div>
  )
}
