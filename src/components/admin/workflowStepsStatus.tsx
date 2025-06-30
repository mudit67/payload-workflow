'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@payloadcms/ui'
import './workflowStepStatus.css'

interface WorkflowStep {
  id: string
  step_name: string
  type: 'approval' | 'review' | 'sign-off' | 'comment-only'
  step_status: 'approved' | 'rejected' | 'pending'
  workflow_name: string
  doc_id: string
  collection_name: string
  assigned_to: any
}

export default function AssignedWorkflowSteps() {
  const { user } = useAuth()
  const [assignedSteps, setAssignedSteps] = useState<WorkflowStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingSteps, setUpdatingSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchAssignedSteps = async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/admin/assigned-workflow-steps', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setAssignedSteps(data.assignedSteps)
        } else {
          setError('Failed to fetch assigned workflow steps')
        }
      } catch (err) {
        setError('Error fetching workflow steps')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignedSteps()
  }, [user])

  const handleStepAction = async (stepId: string, action: 'approved' | 'rejected') => {
    setUpdatingSteps((prev) => new Set(prev).add(stepId))

    try {
      const response = await fetch('/api/admin/workflow-step-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          stepId,
          step_status: action,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        setAssignedSteps((prev) =>
          prev.map((step) => (step.id === stepId ? { ...step, step_status: action } : step)),
        )

        const stepName = assignedSteps.find((step) => step.id === stepId)?.step_name
        // You could use Payload's toast system here instead of alert
        console.log(`✅ Step "${stepName}" has been ${action}`)
      } else {
        const errorData = await response.json()
        console.error(`❌ Failed to update step status: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating step:', error)
    } finally {
      setUpdatingSteps((prev) => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  const handleStatusChange = async (
    stepId: string,
    newStatus: 'approved' | 'rejected' | 'pending',
  ) => {
    setUpdatingSteps((prev) => new Set(prev).add(stepId))

    try {
      const response = await fetch(`/api/admin/workflow-step-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          stepId,
          step_status: newStatus,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        setAssignedSteps((prev) =>
          prev.map((step) => (step.id === stepId ? { ...step, step_status: newStatus } : step)),
        )

        const stepName = assignedSteps.find((step) => step.id === stepId)?.step_name
        console.log(`Step "${stepName}" status changed to ${newStatus}`)
      } else {
        const errorData = await response.json()
        console.error(
          `❌ Failed to update step status: ${errorData.errors?.[0]?.message || 'Unknown error'}`,
        )
      }
    } catch (error) {
      console.error('Error updating step:', error)
    } finally {
      setUpdatingSteps((prev) => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  const refreshSteps = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/assigned-workflow-steps', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAssignedSteps(data.assignedSteps)
      }
    } catch (err) {
      console.error('Error refreshing steps:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return null
  }

  if (loading) {
    return (
      <div className="workflow-steps">
        <div className="workflow-steps__header">
          <h3 className="workflow-steps__title">My Assigned Workflow Steps</h3>
        </div>
        <div className="workflow-steps__loading">
          <div className="workflow-steps__skeleton">
            <div className="workflow-steps__skeleton-line workflow-steps__skeleton-line--title"></div>
            <div className="workflow-steps__skeleton-item"></div>
            <div className="workflow-steps__skeleton-item"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="workflow-steps">
        <div className="workflow-steps__header">
          <h3 className="workflow-steps__title">My Assigned Workflow Steps</h3>
        </div>
        <div className="workflow-steps__error">
          <p className="workflow-steps__error-message">{error}</p>
          <button onClick={refreshSteps} className="btn btn--style-secondary btn--size-small">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="workflow-steps">
      <div className="workflow-steps__header">
        <h3 className="workflow-steps__title">
          My Assigned Workflow Steps ({assignedSteps.length})
        </h3>
        <button
          onClick={refreshSteps}
          disabled={loading}
          className="btn btn--style-secondary btn--size-small"
        >
          🔄 Refresh
        </button>
      </div>

      {assignedSteps.length === 0 ? (
        <div className="workflow-steps__empty">
          <div className="workflow-steps__empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="workflow-steps__empty-text">No workflow steps assigned to you</p>
        </div>
      ) : (
        <div className="workflow-steps__list">
          {assignedSteps.map((step) => {
            const isUpdating = updatingSteps.has(step.id)

            return (
              <div
                key={step.id}
                className={`workflow-steps__item ${isUpdating ? 'workflow-steps__item--updating' : ''}`}
              >
                <div className="workflow-steps__item-content">
                  <div className="workflow-steps__item-main">
                    <div className="workflow-steps__item-header">
                      <h4 className="workflow-steps__step-name">{step.step_name}</h4>
                      <span className={`pill pill--${step.type}`}>{step.type}</span>
                      <span className={`pill pill--${step.step_status}`}>{step.step_status}</span>
                      {isUpdating && (
                        <div className="workflow-steps__loading-indicator">
                          <div className="loading-indicator"></div>
                        </div>
                      )}
                    </div>
                    <div className="workflow-steps__item-details">
                      <p className="workflow-steps__detail">
                        <strong>Workflow:</strong> {step.workflow_name}
                      </p>
                      <p className="workflow-steps__detail">
                        <strong>Collection:</strong> {step.collection_name}
                      </p>
                      <p className="workflow-steps__detail">
                        <strong>Document ID:</strong> {step.doc_id}
                      </p>
                    </div>
                  </div>

                  <div className="workflow-steps__item-actions">
                    <select
                      value={step.step_status}
                      onChange={(e) =>
                        handleStatusChange(
                          step.id,
                          e.target.value as 'approved' | 'rejected' | 'pending',
                        )
                      }
                      disabled={isUpdating}
                      className="input input--style-default"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    {step.step_status === 'pending' && (
                      <div className="workflow-steps__quick-actions">
                        <button
                          onClick={() => handleStepAction(step.id, 'approved')}
                          disabled={isUpdating}
                          className="btn btn--style-success btn--size-small"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleStepAction(step.id, 'rejected')}
                          disabled={isUpdating}
                          className="btn btn--style-error btn--size-small"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
