'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/auth-helpers-nextjs'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const initialize = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        console.log('Initial session check:', initialSession?.user?.id)
        
        if (initialSession?.user) {
          setUser(initialSession.user)
          // Ensure session is properly set
          await supabase.auth.setSession({
            access_token: initialSession.access_token,
            refresh_token: initialSession.refresh_token,
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Session initialization error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setUser(session.user)
            // Refresh session in storage
            await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            })
            // Force update any cached data
            await fetch('/api/accounts', { 
              method: 'GET',
              headers: { 'Cache-Control': 'no-cache' }
            })
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          // Clear any cached data
          setLoading(true)
          window.location.href = '/auth/signin'
        }
      }
    )

    initialize()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}