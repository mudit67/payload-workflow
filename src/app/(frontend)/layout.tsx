import React from 'react'
import './styles.css'
import AuthButton from '@/components/AuthButton'
import Footer from '@/components/Footer'
import Link from 'next/link'
export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Teal Blogs',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <nav className="bg-gray-800 p-4 shadow-lg rounded-b-lg">
          <div className="container mx-auto flex justify-between items-center">
            {/* <a href="/"> */}
            <Link href="/">
              <div className="text-white text-2xl font-bold font-inter">Teal Blogs</div>
              {/* </a> */}
            </Link>
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
