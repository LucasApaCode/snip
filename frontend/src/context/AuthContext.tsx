import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthContextType {
  token: string | null
  email: string | null
  signIn: (token: string, email: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('snip_token')
  )
  const [email, setEmail] = useState<string | null>(
    () => localStorage.getItem('snip_email')
  )

  function signIn(token: string, email: string) {
    localStorage.setItem('snip_token', token)
    localStorage.setItem('snip_email', email)
    setToken(token)
    setEmail(email)
  }

  function signOut() {
    localStorage.removeItem('snip_token')
    localStorage.removeItem('snip_email')
    setToken(null)
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ token, email, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
