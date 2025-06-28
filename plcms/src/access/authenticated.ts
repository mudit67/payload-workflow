import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type isAuthenticated = (args: AccessArgs<User>) => boolean

export const authenticated: isAuthenticated = ({ req }) => {
  // console.log('Req: ', req)
  if (req.user) {
    if (req.pathname.indexOf('/admin') == 0) {
      // console.log('Admin page', req.user.role == 'admin')

      return req.user.role == 'admin'
    }
    return true
  }
  return false
}

export const adminAuth: isAuthenticated = ({ req }) => {
  // console.log('Req: ', req)
  if (req.user) {
    if (req.pathname.indexOf('/admin') == 0) {
      // console.log('Admin page', req.user.role == 'admin')

      return req.user.role == 'admin'
    }
    return false
  }
  return false
}
