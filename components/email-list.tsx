'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Mail, Star, Paperclip } from 'lucide-react'

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

interface EmailListProps {
  messages: Message[]
  loading?: boolean
  onMessageSelect?: (message: Message) => void
}

export function EmailList({ messages, loading, onMessageSelect }: EmailListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className="text-center py-8">
        <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-2 text-lg font-semibold">No messages</h3>
        <p className="text-sm text-muted-foreground">Your inbox is empty</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <button
          key={message.id}
          onClick={() => onMessageSelect?.(message)}
          className="w-full p-4 text-left rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">
                  {message.from[0]?.name || message.from[0]?.email}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(message.date), { addSuffix: true })}
                </span>
              </div>
              <h4 className={`mt-1 ${message.isUnread ? 'font-semibold' : ''}`}>
                {message.subject || '(no subject)'}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {message.snippet}
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              {message.hasAttachments && (
                <Paperclip className="h-4 w-4" />
              )}
              {message.isStarred && (
                <Star className="h-4 w-4 fill-current text-yellow-400" />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}