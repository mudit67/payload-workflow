'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Workflow } from './page'

// interface WorkflowStep {
//   step_name: string
//   type: 'approval' | 'review' | 'sign-off' | 'comment-only'
//   id?: string
// }

// interface Workflow {
//   id: string
//   name: string
//   collection_name: string
//   steps: WorkflowStep[]
//   createdAt: string
//   updatedAt: string
// }

const stepTypeColors = {
  approval: 'bg-red-100 text-red-800',
  review: 'bg-yellow-100 text-yellow-800',
  'sign-off': 'bg-green-100 text-green-800',
  'comment-only': 'bg-blue-100 text-blue-800',
}

export function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workflow/${workflow.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the page to show updated list
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Failed to delete workflow: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowConfirmDialog(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{workflow.name}</h3>
              <p className="text-sm text-gray-600">
                Collection: <span className="font-medium">{workflow.collection_name}</span>
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {workflow.steps.length} steps
              </span>
            </div>
          </div>

          {/* Steps Preview */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Steps:</h4>
            <div className="space-y-2">
              {workflow.steps.slice(0, 3).map((step, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate flex-1">
                    {index + 1}. {step.step_name}
                    {step.assigned_to && (
                      <span className="text-xs text-gray-500 ml-2">
                        →{' '}
                        {typeof step.assigned_to === 'object' ? step.assigned_to.email : 'Assigned'}
                      </span>
                    )}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stepTypeColors[step.type]}`}
                  >
                    {step.type}
                  </span>
                </div>
              ))}
              {workflow.steps.length > 3 && (
                <p className="text-xs text-gray-500">+{workflow.steps.length - 3} more steps</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Created {formatDistanceToNow(new Date(workflow.createdAt))} ago
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowConfirmDialog(true)}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Workflow</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the workflow &quot;{workflow.name}&quot;? This
                  action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
