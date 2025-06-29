import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Post {
  id: string
  title: string
  content: any
  authors: any
  publishedAt: string
  createdAt: string
  updatedAt: string
}

interface PostCardProps {
  post: Post
  userRole: string
}

export default function PostCard({ post, userRole }: PostCardProps) {
  const getContentPreview = (content: any) => {
    if (!content) return 'No content available'

    // Extract text from rich text content (simplified)
    if (typeof content === 'object' && content.root) {
      // Handle Lexical rich text format
      const extractText = (node: any): string => {
        if (node.type === 'text') return node.text || ''
        if (node.children) {
          return node.children.map(extractText).join('')
        }
        return ''
      }

      const text = content.root.children?.map(extractText).join(' ') || ''
      return text.substring(0, 150) + (text.length > 150 ? '...' : '')
    }

    return 'Content preview not available'
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
            {post.authors && (
              <p className="text-sm text-gray-600 mb-2">
                By: {typeof post.authors === 'object' ? post.authors.email : 'Unknown Author'}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            {userRole === 'user' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Comment Only
              </span>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-3">{getContentPreview(post.content)}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {post.publishedAt ? (
              <>Published {formatDistanceToNow(new Date(post.publishedAt))} ago</>
            ) : (
              <>Created {formatDistanceToNow(new Date(post.createdAt))} ago</>
            )}
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/posts/${post.id}`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {userRole === 'user' ? 'Comment' : 'View'}
            </Link>
            {(userRole === 'admin' || userRole === 'staff') && (
              <Link
                href={`/admin/collections/posts/${post.id}`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
