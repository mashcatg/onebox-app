'use client'

import { useCallback } from 'react'
import { Mail } from 'lucide-react'

interface EmailAccount {
  id: string
  grant_id: string
  email: string
  provider: string
  grant_status: string
  is_primary: boolean
}

interface EmailAccountSelectorProps {
  accounts: EmailAccount[]
  selectedAccount?: EmailAccount | null
  onAccountSelect: (account: EmailAccount) => void
}

export function EmailAccountSelector({
  accounts,
  selectedAccount,
  onAccountSelect,
}: EmailAccountSelectorProps) {
  const getProviderColor = useCallback((provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google':
        return 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
      case 'outlook':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
      case 'yahoo':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
  }, [])

  if (!accounts.length) {
    return (
      <div className="p-4 text-center border rounded-lg bg-muted">
        <p className="text-muted-foreground">No email accounts connected</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <button
          key={account.id}
          onClick={() => onAccountSelect(account)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors
            ${selectedAccount?.id === account.id 
              ? 'bg-accent text-accent-foreground' 
              : 'hover:bg-muted'
            }
          `}
        >
          <div className={`p-2 rounded-full ${getProviderColor(account.provider)}`}>
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium">{account.email}</div>
            <div className="text-sm text-muted-foreground capitalize">
              {account.provider} {account.is_primary && '(Primary)'}
            </div>
          </div>
          {account.grant_status !== 'valid' && (
            <span className="px-2 py-1 text-xs rounded-full bg-destructive text-destructive-foreground">
              Reconnect
            </span>
          )}
        </button>
      ))}
    </div>
  )
}