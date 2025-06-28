// src/components/WorkflowCreator.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@payloadcms/ui'

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
  assigned_role: string
  conditions?: string
}

interface WorkflowFormData {
  name: string
  collection_name: string
  steps: WorkflowStep[]
  is_active: boolean
}

export const WorkflowCreator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    collection_name: '',
    steps: [{ step_name: '', type: 'approval', assigned_role: '' }],
    is_active: true,
  })

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections-list')
      if (response.ok) {
        const data = await response.json()
        setCollections(
          data.filter(
            (col: Collection) =>
              ![
                'users',
                'workflows',
                'workflow-logs',
                'payload-preferences',
                'payload-migrations',
              ].includes(col.slug),
          ),
        )
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    }
  }

  const handleInputChange = (field: keyof WorkflowFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (index: number, field: keyof WorkflowStep, value: string) => {
    const updatedSteps = [...formData.steps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setFormData((prev) => ({ ...prev, steps: updatedSteps }))
  }

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { step_name: '', type: 'approval', assigned_role: '' }],
    }))
  }

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const updatedSteps = formData.steps.filter((_, i) => i !== index)
      setFormData((prev) => ({ ...prev, steps: updatedSteps }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Reset form and close modal
        setFormData({
          name: '',
          collection_name: '',
          steps: [{ step_name: '', type: 'approval', assigned_role: '' }],
          is_active: true,
        })
        setIsOpen(false)
        // Refresh the page to show new workflow
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`Error creating workflow: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Failed to create workflow')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div
        style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Workflow Management</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Create and manage approval workflows for your collections
            </p>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            // style={{
            //   backgroundColor: '#0070f3',
            //   color: 'white',
            //   border: 'none',
            //   borderRadius: '6px',
            //   padding: '10px 20px',
            //   cursor: 'pointer',
            // }}
          >
            Create New Workflow
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e1e5e9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: 0, color: '#333' }}>Create New Workflow</h3>
        <Button
          onClick={() => setIsOpen(false)}
    
        //   style={{
        //     backgroundColor: '#6c757d',
        //     color: 'white',
        //     border: 'none',
        //     borderRadius: '4px',
        //     padding: '8px 16px',
        //   }}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        {/* Workflow Name */}
        <div>
          <label
            style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}
          >
            Workflow Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            placeholder="Enter workflow name"
          />
        </div>

        {/* Collection Selection */}
        <div>
          <label
            style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}
          >
            Target Collection
          </label>
          <select
            required
            value={formData.collection_name}
            onChange={(e) => handleInputChange('collection_name', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <label style={{ fontWeight: '500', color: '#333' }}>Workflow Steps</label>
            <Button
              type="button"
              onClick={addStep}
            //   style={{
            //     backgroundColor: '#28a745',
            //     color: 'white',
            //     border: 'none',
            //     borderRadius: '4px',
            //     padding: '6px 12px',
            //     fontSize: '12px',
            //   }}
            >
              Add Step
            </Button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {formData.steps.map((step, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  border: '1px solid #e1e5e9',
                  borderRadius: '6px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>Step {index + 1}</h4>
                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Step Name
                    </label>
                    <input
                      type="text"
                      required
                      value={step.step_name}
                      onChange={(e) => handleStepChange(index, 'step_name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                      placeholder="e.g., Manager Approval"
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      Step Type
                    </label>
                    <select
                      value={step.type}
                      onChange={(e) =>
                        handleStepChange(index, 'type', e.target.value as WorkflowStep['type'])
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                    >
                      <option value="approval">Approval</option>
                      <option value="review">Review</option>
                      <option value="sign-off">Sign-off</option>
                      <option value="comment-only">Comment Only</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: '#666',
                    }}
                  >
                    Assigned Role/User
                  </label>
                  <input
                    type="text"
                    required
                    value={step.assigned_role}
                    onChange={(e) => handleStepChange(index, 'assigned_role', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                    placeholder="e.g., manager, admin, user@example.com"
                  />
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '4px',
                      fontSize: '12px',
                      color: '#666',
                    }}
                  >
                    Conditions (Optional)
                  </label>
                  <textarea
                    value={step.conditions || ''}
                    onChange={(e) => handleStepChange(index, 'conditions', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                      minHeight: '60px',
                    }}
                    placeholder='e.g., {"amount": {"$gt": 10000}}'
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
          />
          <label htmlFor="is_active" style={{ fontSize: '14px', color: '#333' }}>
            Activate workflow immediately
          </label>
        </div>

        {/* Submit Button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #e1e5e9',
          }}
        >
          <Button
            type="submit"
            disabled={loading}
            // style={{
            //   backgroundColor: loading ? '#6c757d' : '#0070f3',
            //   color: 'white',
            //   border: 'none',
            //   borderRadius: '4px',
            //   padding: '10px 20px',
            //   cursor: loading ? 'not-allowed' : 'pointer',
            // }}
          >
            {loading ? 'Creating...' : 'Create Workflow'}
          </Button>
        </div>
      </form>
    </div>
  )
}
