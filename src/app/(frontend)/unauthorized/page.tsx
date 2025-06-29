import Link from 'next/link'

export default function UnauthorizedPage() {
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-lg text-gray-600">
          You don&apos;t have permission to access this page.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Please contact your administrator if you believe this is an error.
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
          >
            Go Home
          </Link>
          <Link
            href="/logout"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
          >
            Logout
          </Link>
        </div>
      </div>
    </div>
  )
}
