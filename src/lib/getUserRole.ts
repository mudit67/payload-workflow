import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
interface User {
  id: number
  email: string
  role: string
}

export default async function getUserRole(): Promise<User | null> {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const user = await payload
    .auth({ headers: headersList, canSetHeaders: false })
    .then((authRes) => {
      if (!authRes.user) return null
      const user: User = {
        role: authRes.user.role || '',
        email: authRes.user.email,
        id: authRes.user.id,
      }
      return user
    })
    .catch(() => {
      console.error('Authentication failed')

      return null
    })

  console.log(user && user.role)

  if (!user) {
    return null
  } else {
    return user
  }
}
