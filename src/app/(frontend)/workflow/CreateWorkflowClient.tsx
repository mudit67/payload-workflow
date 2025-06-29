'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Collection {
  slug: string
  labels: {
    singular: string
    plural: string
  }
}

interface WorkflowStep {
  step_name: string
  type: 'approval' | 'review' | 'sign-off' | 'comment-only'
}

interface WorkflowFormData {
  name: string
  collection_name: string
  steps: WorkflowStep[]
}

interface Props {
  collections: Collection[]
}

export default function CreateWorkflowClient({ collections }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    collection_name: '',
    steps: [{ step_name: '', type: 'approval' }],
  })

  const handleInputChange = (field: keyof WorkflowFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleStepChange = (index: number, field: keyof WorkflowStep, value: string) => {
    const updatedSteps = [...formData.steps]
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value,
    }
    setFormData((prev: any) => ({
      ...prev,
      steps: updatedSteps,
    }))
  }

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { step_name: '', type: 'approval' }],
    }))
  }

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const updatedSteps = formData.steps.filter((_, i) => i !== index)
      setFormData((prev) => ({
        ...prev,
        steps: updatedSteps,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/workflow')
      } else {
        const error = await response.json()
        alert(`Error creating workflow: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Failed to create workflow')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Workflow</h1>
            <p className="mt-2 text-gray-600">
              Set up a new approval workflow for your content collections
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Workflow Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter workflow name"
              />
            </div>

            {/* Collection Selection */}
            <div>
              <label
                htmlFor="collection_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Target Collection
              </label>
              <select
                id="collection_name"
                required
                value={formData.collection_name}
                onChange={(e) => handleInputChange('collection_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.slug} value={collection.slug}>
                    {collection.labels?.singular || collection.slug}
                  </option>
                ))}
              </select>
            </div>

            {/* Workflow Steps */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Workflow Steps</label>
                <button
                  type="button"
                  onClick={addStep}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  Add Step
                </button>
              </div>

              <div className="space-y-4">
                {formData.steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Step {index + 1}</h4>
                      {formData.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Step Name
                        </label>
                        <input
                          type="text"
                          required
                          value={step.step_name}
                          onChange={(e) => handleStepChange(index, 'step_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Manager Approval"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Step Type
                        </label>
                        <select
                          value={step.type}
                          onChange={(e) =>
                            handleStepChange(index, 'type', e.target.value as WorkflowStep['type'])
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="approval">Approval</option>
                          <option value="review">Review</option>
                          <option value="sign-off">Sign-off</option>
                          <option value="comment-only">Comment Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Workflow'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
