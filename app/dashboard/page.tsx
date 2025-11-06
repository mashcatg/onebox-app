'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { EmailAccountSelector } from '@/components/email-account-selector'
import { EmailList } from '@/components/email-list'
import { Mail, Plus, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface EmailAccount {
  id: string
  grant_id: string
  email: string
  provider: string
  grant_status: string
  is_primary: boolean
}

interface Message {
  id: string
  subject: string
  from: { email: string; name?: string }[]
  snippet: string
  date: string
  hasAttachments?: boolean
  isStarred?: boolean
  isUnread?: boolean
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  // Fetch connected accounts
  const fetchAccounts = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/accounts')
      const data = await response.json()
      
      if (response.ok) {
        console.log('Fetched accounts:', data) // Debug log
        setAccounts(data)
        // If we just connected a new account, select it
        const justConnected = searchParams.get('email')
        if (justConnected) {
          const newAccount = data.find((acc: EmailAccount) => acc.email === justConnected)
          if (newAccount) {
            setSelectedAccount(newAccount)
          }
        } else if (data.length > 0 && !selectedAccount) {
          // Select the first account if none is selected
          setSelectedAccount(data[0])
        }
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error) // Debug log
      setError('Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }, [user?.id, searchParams])

  // Fetch messages for selected account
  const fetchMessages = useCallback(async (grantId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages?grantId=${grantId}&limit=50`)
      const data = await response.json()
      
      if (response.ok) {
        setMessages(data.data)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load accounts when user is available
  useEffect(() => {
    if (user?.id) {
      fetchAccounts()
    }
  }, [user, fetchAccounts])

  // Load messages when account is selected
  useEffect(() => {
    if (selectedAccount?.grant_id) {
      fetchMessages(selectedAccount.grant_id)
    }
  }, [selectedAccount, fetchMessages])

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/signin')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (accounts.length === 0 && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">No Email Accounts Connected</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your first email account to start managing your emails
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="mt-4 inline-flex items-center justify-center px-4 py-2"
          >
            Connect Email Account
          </Button>
        </div>
      </div>
    )
  }

  const params = new URLSearchParams(searchParams?.toString())
  const success = params.get('success')
  const connectedEmail = params.get('email')

  return (
    <div className="container mx-auto p-4 min-h-screen">
      {/* Success message */}
      {success === 'account_connected' && connectedEmail && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg relative mb-4">
          Successfully connected {connectedEmail}!
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg relative mb-4">
          {error}
        </div>
      )}

      {/* Header with logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Onebox</h1>
        <Button
          onClick={handleLogout}
          variant="destructive"
          size="sm"
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Accounts</h2>
            <Link
              href="/connect"
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="Connect new account"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>

          <EmailAccountSelector
            accounts={accounts}
            selectedAccount={selectedAccount}
            onAccountSelect={setSelectedAccount}
          />
        </div>

        {/* Main content */}
        <div className="md:col-span-9">
          {selectedAccount ? (
            <>
              <h2 className="text-xl font-semibold mb-6">
                Inbox for {selectedAccount.email}
              </h2>
              <EmailList
                messages={messages}
                loading={loading}
                onMessageSelect={(message) => {
                  // Handle message selection
                  console.log('Selected message:', message)
                }}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No account selected</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Select an email account from the sidebar or connect a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}