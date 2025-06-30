import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type isAuthenticated = (args: AccessArgs<User>) => boolean

export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return Boolean(user)
}
export const isStaff: isAuthenticated = ({ req: { user } }) => {
  if (!!user) {
    return user.role == 'admin' || user.role == 'staff'
  }
  return false
}
export const isAdmin: isAuthenticated = ({ req: { user } }) => {
  if (!!user) {
    // console.log(user.name, user.role)

    return user.role == 'admin'
  }
  return false
}

export const isAnyone = () => {
  return true
}

export const noOne = () => {
  return false
}
