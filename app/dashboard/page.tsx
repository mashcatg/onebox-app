'use client'

import { useCallback, useEffect, useState } from 'react'

interface EmailAccount {
  id: string
  grant_id: string
  email: string
  provider: string
  grant_status: string
}

interface Message {
  id: string
  subject: string
  from: { email: string; name: string }
  snippet: string
  date: string
}

export default function Dashboard() {
  const user = useUser()
  const [searchParams] = useSearchParams()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch connected accounts
  const fetchAccounts = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/accounts?userId=${user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setAccounts(data.accounts)
        // If we just connected a new account, select it
        const justConnected = searchParams?.get('email')
        const newAccount = data.accounts.find(acc => acc.email === justConnected)
        if (newAccount) {
          setSelectedAccount(newAccount)
        }
      } else {
        setError(data.error)
      }
    } catch (error) {
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

  // Load accounts on mount
  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // Load messages when account is selected
  useEffect(() => {
    if (selectedAccount) {
      fetchMessages(selectedAccount.grant_id)
    }
  }, [selectedAccount, fetchMessages])

  if (!user) {
    return <div className="p-4">Please sign in to view your dashboard</div>
  }

  return (
    <div className="container mx-auto p-4">
      {/* Success message */}
      {searchParams?.get('success') === 'account_connected' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          Successfully connected {searchParams.get('email')}!
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {/* Account selection */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Connected Email Accounts</h2>
        <div className="flex flex-wrap gap-4">
          {accounts.map(account => (
            <button
              key={account.grant_id}
              onClick={() => setSelectedAccount(account)}
              className={`px-4 py-2 rounded-lg ${
                selectedAccount?.grant_id === account.grant_id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {account.email}
            </button>
          ))}
          <a
            href="/connect"
            className="px-4 py-2 rounded-lg bg-green-500 text-white"
          >
            Connect New Account
          </a>
        </div>
      </div>

      {/* Messages list */}
      {selectedAccount && (
        <div>
          <h3 className="text-lg font-bold mb-4">
            Messages for {selectedAccount.email}
          </h3>
          {loading ? (
            <div>Loading messages...</div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className="p-4 border rounded-lg hover:shadow-md"
                >
                  <div className="font-bold">{message.subject}</div>
                  <div className="text-sm text-gray-600">
                    From: {message.from.name} ({message.from.email})
                  </div>
                  <div className="text-sm mt-2">{message.snippet}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(message.date).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}