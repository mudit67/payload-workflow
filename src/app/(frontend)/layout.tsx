import React from 'react'
import './styles.css'
import AuthButton from '@/components/AuthButton'
import Footer from '@/components/Footer'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <nav className="bg-gray-800 p-4 shadow-lg rounded-b-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="text-white text-2xl font-bold font-inter">Teal Blogs</div>
            <div>
              <AuthButton />
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
