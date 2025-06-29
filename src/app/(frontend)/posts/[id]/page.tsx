'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  content: any
  authors: any
  publishedAt: string
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  email: string
  role: string
}

interface WorkflowStep {
  step_name: string
  type: 'approval' | 'review' | 'sign-off' | 'comment-only'
}

interface WorkflowData {
  id: string
  name: string
  steps: WorkflowStep[]
  currentStep: string | null
  statusId: string | null
}

interface PostResponse {
  post: Post
  user: User
  workflow: WorkflowData | null
  canAccess: boolean
}

export default function PostPage() {
  const params = useParams()
  const id = params.id as string

  const [data, setData] = useState<PostResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingWorkflow, setUpdatingWorkflow] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/blogs/${id}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError('authentication')
            return
          }
          if (response.status === 403) {
            setError('access')
            return
          }
          if (response.status === 404) {
            setError('notfound')
            return
          }
          throw new Error('Failed to fetch post')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching post:', err)
        setError('fetch')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchPost()
    }
  }, [id])

  const handleWorkflowStepChange = async (newStep: string) => {
    if (!data?.workflow) return

    setUpdatingWorkflow(true)
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          workflowStep: newStep,
          statusId: data.workflow.statusId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Failed to update workflow: ${error.error}`)
        return
      }

      const result = await response.json()

      // Update local state
      setData((prev) =>
        prev
          ? {
              ...prev,
              workflow: prev.workflow
                ? {
                    ...prev.workflow,
                    currentStep: newStep,
                    statusId: result.workflowStatus.id,
                  }
                : null,
            }
          : null,
      )

      alert(result.message)
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert('Failed to update workflow status')
    } finally {
      setUpdatingWorkflow(false)
    }
  }

  const renderContent = (content: any) => {
    if (!content) return <p className="text-gray-500">No content available.</p>

    // Handle Lexical rich text format
    if (typeof content === 'object' && content.root) {
      const renderNode = (node: any): string => {
        if (node.type === 'text') {
          let text = node.text || ''
          if (node.format & 1) text = `<strong>${text}</strong>` // Bold
          if (node.format & 2) text = `<em>${text}</em>` // Italic
          return text
        }

        if (node.type === 'paragraph') {
          const children = node.children?.map(renderNode).join('') || ''
          return `<p class="mb-4">${children}</p>`
        }

        if (node.type === 'heading') {
          const children = node.children?.map(renderNode).join('') || ''
          const level = node.tag || 'h2'
          return `<${level} class="text-2xl font-bold mb-4 mt-6">${children}</${level}>`
        }

        if (node.children) {
          return node.children.map(renderNode).join('')
        }

        return ''
      }

      const htmlContent = content.root.children?.map(renderNode).join('') || ''
      return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    }

    // Handle plain HTML string
    if (typeof content === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: content }} />
    }

    return <p className="text-gray-500">Content format not supported.</p>
  }

  const getStepTypeColor = (type: string) => {
    const colors = {
      approval: 'bg-red-100 text-red-800',
      review: 'bg-yellow-100 text-yellow-800',
      'sign-off': 'bg-green-100 text-green-800',
      'comment-only': 'bg-blue-100 text-blue-800',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {error === 'authentication' && 'Authentication Required'}
            {error === 'access' && 'Access Denied'}
            {error === 'notfound' && 'Post Not Found'}
            {error === 'fetch' && 'Error Loading Post'}
          </h3>
          <p className="mt-2 text-gray-500">
            {error === 'authentication' && 'Please log in to view this post.'}
            {error === 'access' && 'You do not have permission to view this post.'}
            {error === 'notfound' && 'The requested post could not be found.'}
            {error === 'fetch' && 'Please try again later or contact support.'}
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            {error === 'authentication' && (
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div>No data available</div>
  }

  const { post, user, workflow } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-indigo-600 hover:text-indigo-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                  {post.authors && (
                    <span>
                      By: {typeof post.authors === 'object' ? post.authors.email : 'Unknown Author'}
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    {post.publishedAt
                      ? `Published on ${new Date(post.publishedAt).toLocaleDateString()}`
                      : `Created on ${new Date(post.createdAt).toLocaleDateString()}`}
                  </span>
                  {workflow?.currentStep && (
                    <>
                      <span>•</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStepTypeColor(
                          workflow.steps.find((s) => s.step_name === workflow.currentStep)?.type ||
                            '',
                        )}`}
                      >
                        {workflow.currentStep}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">{renderContent(post.content)}</div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Last updated: {new Date(post.updatedAt).toLocaleDateString()}
            </div>
            <div className="flex space-x-3">
              {user.role === 'user' ? (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
                  Add Comment
                </button>
              ) : (
                <>
                  <Link
                    href={`/admin/collections/posts/${post.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                  >
                    Edit Post
                  </Link>
                  {workflow && (
                    <div className="relative">
                      <select
                        value={workflow.currentStep || ''}
                        onChange={(e) => handleWorkflowStepChange(e.target.value)}
                        disabled={updatingWorkflow}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="" disabled>
                          Select workflow step
                        </option>
                        {workflow.steps.map((step) => (
                          <option key={step.step_name} value={step.step_name}>
                            {step.step_name} ({step.type})
                          </option>
                        ))}
                      </select>
                      {updatingWorkflow && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
