'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Collection {
  slug: string
  labels: {
    singular: string
    plural: string
  }
  fields: Array<{
    name: string
    type: string
  }>
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface WorkflowStep {
  step_name: string
  type: 'approval' | 'review' | 'sign-off' | 'comment-only'
  assigned_to: string
  field_name: string
  operator: string
  desiredValue: string
  status: 'approved' | 'pending' | 'reject'
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
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    collection_name: '',
    steps: [
      {
        step_name: '',
        type: 'approval',
        assigned_to: '',
        field_name: '',
        operator: 'text:length:equals',
        desiredValue: '',
        status: 'pending',
      },
    ],
  })

  // Supported field types for workflow conditions
  const supportedFieldTypes = [
    'text',
    'textarea',
    'email',
    'number',
    'checkbox',
    'date',
    'richText',
  ]

  // Get the selected collection's supported fields
  const selectedCollection = collections.find((col) => col.slug === formData.collection_name)
  const availableFields =
    selectedCollection?.fields.filter((field) => supportedFieldTypes.includes(field.type)) || []

  // Fetch admin/staff users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const response = await fetch('/api/users/admin-staff', {
          credentials: 'include',
        })
        if (response.ok) {
          const result = await response.json()
          setUsers(result.users)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [])

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

    // Reset dependent fields when field_name changes
    if (field === 'field_name') {
      updatedSteps[index].operator =
        getOperatorOptions(availableFields.find((f) => f.name === value)?.type || '')[0]?.value ||
        ''
      updatedSteps[index].desiredValue = ''
    }

    setFormData((prev) => ({
      ...prev,
      steps: updatedSteps,
    }))
  }

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          step_name: '',
          type: 'approval',
          assigned_to: '',
          field_name: '',
          operator: 'text:length:equals',
          desiredValue: '',
          status: 'pending',
        },
      ],
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
      // Transform form data to match Payload collection structure
      const workflowData = {
        name: formData.name,
        collection_name: formData.collection_name,
        steps: formData.steps.map((step) => ({
          step_name: step.step_name,
          type: step.type,
          assigned_to: Number(step.assigned_to) || null, // Relationship field - can be null
          field_name: step.field_name,
          operator: step.operator,
          desiredValue: step.desiredValue,
          status: step.status || 'pending', // Default to pending if not set
        })),
      }

      // Validate required fields
      if (!workflowData.name || !workflowData.collection_name) {
        alert('Please fill in all required fields: Workflow Name and Collection')
        setLoading(false)
        return
      }

      // Validate steps
      for (let i = 0; i < workflowData.steps.length; i++) {
        const step = workflowData.steps[i]
        if (!step.step_name || !step.type) {
          alert(`Step ${i + 1}: Please fill in Step Name and Step Type`)
          setLoading(false)
          return
        }

        // If field_name is provided, operator and desiredValue should also be provided
        if (step.field_name && (!step.operator || !step.desiredValue)) {
          alert(
            `Step ${i + 1}: If Field to Check is selected, Operator and Desired Value are required`,
          )
          setLoading(false)
          return
        }
      }

      // Step 1: Create the workflow
      const workflowResponse = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      })

      if (!workflowResponse.ok) {
        const error = await workflowResponse.json()
        alert(`Error creating workflow: ${error.error || 'Unknown error'}`)
        setLoading(false)
        return
      }

      const workflowResult = await workflowResponse.json()
      console.log('Workflow created successfully:', workflowResult)

      // Step 2: Create the workflow hook
      try {
        const hookResponse = await fetch('/api/createWorkflowHook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workflowId: workflowResult.doc.id,
            collectionName: workflowData.collection_name,
            workflowData: workflowData,
            processExistingDocuments: true,
          }),
        })

        if (!hookResponse.ok) {
          const hookError = await hookResponse.json()
          console.error('Error creating workflow hook:', hookError)
          alert(
            `Workflow created but failed to register hook: ${hookError.error || 'Unknown error'}`,
          )
          // Still redirect to workflow page since workflow was created
          router.push('/workflow')
          return
        }

        const hookResult = await hookResponse.json()
        console.log('Workflow hook created successfully:', hookResult)

        alert('Workflow and hook created successfully!')
        router.push('/workflow')
      } catch (hookError) {
        console.error('Error creating workflow hook:', hookError)
        alert(
          'Workflow created but failed to register hook. Please try registering the hook manually.',
        )
        router.push('/workflow')
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Failed to create workflow. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'richText': // Add richText support
        return [
          { label: 'Text Length Equals', value: 'text:length:equals' },
          { label: 'Text Length >=', value: 'text:length:greaterThanEqualsTo' },
          { label: 'Text Length <=', value: 'text:length:lessThanEqualsTo' },
          { label: 'Text Length >', value: 'text:length:greaterThan' },
          { label: 'Text Length <', value: 'text:length:lessThan' },
          { label: 'Text Starts With', value: 'text:startsWith' },
          { label: 'Text Ends With', value: 'text:endsWith' },
          { label: 'Text Contains', value: 'text:contains' },
        ]
      case 'number':
        return [
          { label: 'Number Equals', value: 'number:equals' },
          { label: 'Number >=', value: 'number:greaterThanEqualsTo' },
          { label: 'Number <=', value: 'number:lessThanEqualsTo' },
          { label: 'Number >', value: 'number:greaterThan' },
          { label: 'Number <', value: 'number:lessThan' },
        ]
      case 'checkbox':
        return [{ label: 'Checkbox Equals', value: 'checkBox:equals' }]
      case 'date':
        return [
          { label: 'Date Equals', value: 'date:equals' },
          { label: 'Date >=', value: 'date:greaterThanEqualsTo' },
          { label: 'Date <=', value: 'date:lessThanEqualsTo' },
          { label: 'Date >', value: 'date:greaterThan' },
          { label: 'Date <', value: 'date:lessThan' },
        ]
      default:
        return [
          { label: 'Text Contains', value: 'text:contains' },
          { label: 'Text Equals', value: 'text:length:equals' },
        ]
    }
  }

  const renderDesiredValueInput = (step: WorkflowStep, index: number) => {
    const selectedField = availableFields.find((field) => field.name === step.field_name)
    const fieldType = selectedField?.type

    switch (fieldType) {
      case 'number':
        return (
          <input
            type="number"
            value={step.desiredValue}
            onChange={(e) => handleStepChange(index, 'desiredValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter number value"
          />
        )

      case 'checkbox':
        return (
          <select
            value={step.desiredValue}
            onChange={(e) => handleStepChange(index, 'desiredValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select value</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        )

      case 'date':
        return (
          <input
            type="date"
            value={step.desiredValue}
            onChange={(e) => handleStepChange(index, 'desiredValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )

      default:
        return (
          <input
            type="text"
            value={step.desiredValue}
            onChange={(e) => handleStepChange(index, 'desiredValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Value to compare against"
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
                {formData.steps.map((step, index) => {
                  const selectedField = availableFields.find(
                    (field) => field.name === step.field_name,
                  )
                  const operatorOptions = selectedField
                    ? getOperatorOptions(selectedField.type)
                    : []

                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-700">Step {index + 1}</h4>
                        {formData.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove Step
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Step Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
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

                        {/* Step Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Step Type
                          </label>
                          <select
                            value={step.type}
                            onChange={(e) =>
                              handleStepChange(
                                index,
                                'type',
                                e.target.value as WorkflowStep['type'],
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="approval">Approval</option>
                            <option value="review">Review</option>
                            <option value="sign-off">Sign-off</option>
                            <option value="comment-only">Comment Only</option>
                          </select>
                        </div>

                        {/* Assigned To */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Assigned To
                          </label>
                          <select
                            value={step.assigned_to}
                            onChange={(e) => handleStepChange(index, 'assigned_to', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loadingUsers}
                          >
                            <option value="">Select a user</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email} ({user.role})
                              </option>
                            ))}
                          </select>
                          {loadingUsers && (
                            <p className="text-xs text-gray-500 mt-1">Loading users...</p>
                          )}
                        </div>

                        {/* Field Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Field to Check
                          </label>
                          <select
                            value={step.field_name}
                            onChange={(e) => handleStepChange(index, 'field_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!formData.collection_name}
                          >
                            <option value="">Select a field</option>
                            {availableFields.map((field) => (
                              <option key={field.name} value={field.name}>
                                {field.name} ({field.type})
                              </option>
                            ))}
                          </select>
                          {formData.collection_name && availableFields.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              No supported fields found in this collection
                            </p>
                          )}
                        </div>

                        {/* Operator */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Operator
                          </label>
                          <select
                            value={step.operator}
                            onChange={(e) => handleStepChange(index, 'operator', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={!step.field_name}
                          >
                            {operatorOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Desired Value */}
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Desired Value
                          </label>
                          {renderDesiredValueInput(step, index)}
                        </div>
                      </div>
                    </div>
                  )
                })}
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
