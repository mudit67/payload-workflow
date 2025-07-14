'use client'

import { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { UserContext } from '@/lib/authContext'

interface User {
  id: number
  email: string
  role: string
}

export default function Footer() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const ctx = useContext(UserContext)

  useEffect(() => {
    setLoading(true)

    if (ctx?.user) {
      setUser(ctx?.user)
      setLoading(false)
    } else {
      setUser(null)
      setLoading(false)
    }
  }, [ctx, ctx?.user])

  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Right side - Navigation */}
          <div className="flex items-center space-x-6">
            {/* Always visible links */}
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
            >
              Home
            </Link>

            {/* Admin/Staff - Add Post button */}
            {!loading && (user?.role === 'admin' || user?.role === 'staff') && (
              <>
                <Link
                  href="/admin/collections/posts/create"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Post
                </Link>
                <Link
                  href="/admin/"
                  className="inline-flex items-center px-4 py-2 bg-cyan-800 text-white text-sm font-medium rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors duration-200"
                >
                  Admin
                </Link>
              </>
            )}

            {/* Admin-only workflow button */}
            {!loading && user?.role === 'admin' && (
              <Link
                href="/workflow"
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Workflows
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
