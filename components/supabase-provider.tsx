'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await supabase.auth.getSession()
        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [supabase.auth])

  if (isLoading) {
    return null // or a loading spinner
  }

  return children
}