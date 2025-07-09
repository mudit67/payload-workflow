'use client'
import { Children, createContext, ReactNode, useState } from 'react'

export interface AuthContextType {
  user: { id: number; role: string; email: string } | null
  login: (id: number, email: string, role: string) => void
  logout: () => void
}

export const UserContext = createContext<AuthContextType | undefined>({
  user: null,
  login: () => {},
  logout: () => {},
})

interface User {
  id: number
  email: string
  role: string
}

type AuthContextProviderProps = {
  children: ReactNode
}

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<User | null>(null)

  const login = (id: number, email: string, role: string) => {
    setUser({ id: id, email: email, role: role })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <>
      <UserContext.Provider value={{ user, login, logout }}>{children}</UserContext.Provider>
    </>
  )
}
