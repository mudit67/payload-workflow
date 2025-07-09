'use client'

// import { useState, useEffect, Suspense } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import Link from 'next/link'
import LoginCard from '@/components/LoginCard'
// import { Suspense } from 'react'

export default function LoginPage() {
  // const router = useRouter()
  // const searchParams = useSearchParams()
  // const [formData, setFormData] = useState({
  //   email: '',
  //   password: '',
  // })
  // const [loading, setLoading] = useState(false)
  // const [error, setError] = useState('')

  // const redirectTo = searchParams.get('redirect') || '/'

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   setLoading(true)
  //   setError('')

  //   try {
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || ''}/api/users/login`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(formData),
  //       credentials: 'include', // Important for cookie handling
  //     })

  //     const result = await response.json()

  //     if (!response.ok) {
  //       throw new Error(result.message || 'Login failed')
  //     }

  //     // Refresh and redirect
  //     router.refresh()
  //     router.replace(redirectTo)
  //   } catch (err: any) {
  //     setError(err.message || 'Login failed. Please try again.')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [e.target.name]: e.target.value,
  //   }))
  // }

  return (
    // <Suspense>
    <LoginCard />
    // </Suspense>
  )
}
