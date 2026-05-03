'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getHostPolls } from '@/lib/polls'

export default function Home() {
  const router = useRouter()
  const [recentPolls, setRecentPolls] = useState<{ id: string; title: string; createdAt: string }[]>([])

  useEffect(() => {
    const polls = getHostPolls()
    setRecentPolls(polls.slice(0, 5).map(p => ({ id: p.id, title: p.title, createdAt: p.createdAt })))
  }, [])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-text mb-4">PollVote</h1>
          <p className="text-xl text-text-muted">Real-time voting, no account needed</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-lg p-8 space-y-6">
          <button
            onClick={() => router.push('/create')}
            className="w-full py-4 px-6 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
          >
            Create a Poll
          </button>

          {recentPolls.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-muted mb-3">Your recent polls</p>
              <div className="space-y-2">
                {recentPolls.map(poll => (
                  <button
                    key={poll.id}
                    onClick={() => router.push(`/host?p=${btoa(JSON.stringify(poll))}`)}
                    className="w-full text-left px-4 py-3 bg-bg rounded-xl hover:bg-border/30 transition-colors"
                  >
                    <p className="font-medium text-text truncate">{poll.title}</p>
                    <p className="text-xs text-text-muted font-mono">{poll.id}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-text-muted mt-8">
          Polls are stored in your browser. Keep your poll links safe!
        </p>
      </div>
    </div>
  )
}