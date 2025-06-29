import React from 'react'
import './styles.css'
import LogoutButton from '@/components/LogoutButton'
export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-800 p-4 shadow-lg rounded-b-lg">
          {' '}
          {/* Base styling for the navbar */}
          <div className="container mx-auto flex justify-between items-center">
            {' '}
            {/* Container for responsive layout */}
            <div className="text-white text-2xl font-bold font-inter">Teal Blogs</div>
            <div>
              <LogoutButton />
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
