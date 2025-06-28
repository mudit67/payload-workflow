// src/components/WorkflowManager.tsx
'use client'

import React, { useState, useEffect } from 'react'

interface Workflow {
  id: string
  name: string
  collection_name: string
  steps: Array<{
    step_name: string
    type: string
    assigned_role: string
  }>
  is_active: boolean
  createdAt: string
}

export const WorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows?limit=100')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.docs || [])
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      if (response.ok) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, is_active: !currentStatus } : w)),
        )
      }
    } catch (error) {
      console.error('Error updating workflow:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading workflows...</p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            style={{
              padding: '16px',
              border: '1px solid #e1e5e9',
              borderRadius: '8px',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#333' }}>{workflow.name}</h4>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                  Collection: <strong>{workflow.collection_name}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    backgroundColor: workflow.is_active ? '#d4edda' : '#f8d7da',
                    color: workflow.is_active ? '#155724' : '#721c24',
                  }}
                >
                  {workflow.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: workflow.is_active ? '#dc3545' : '#28a745',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {workflow.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            <div>
              <p
                style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '500', color: '#333' }}
              >
                Steps ({workflow.steps.length}):
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {workflow.steps.map((step, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      {index + 1}. {step.step_name}
                    </span>
                    <span style={{ color: '#666' }}>({step.type})</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '10px', color: '#999' }}>
              Created: {new Date(workflow.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px dashed #dee2e6',
          }}
        >
          <p style={{ margin: 0, color: '#666' }}>
            No workflows created yet. Use the form above to create your first workflow.
          </p>
        </div>
      )}
    </div>
  )
}
