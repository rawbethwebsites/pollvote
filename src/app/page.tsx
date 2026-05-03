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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/logos/logo-white.svg" alt="PollVote Logo" className="h-20 dark:hidden" />
            <img src="/logos/logo.png" alt="PollVote Logo" className="h-20 hidden dark:block" />
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--text)' }}>PollVote</h1>
          <p className="text-xl" style={{ color: 'var(--text-muted)' }}>Real-time voting, no account needed</p>
        </div>

        <div className="rounded-2xl shadow-lg p-8 space-y-6" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => router.push('/create')}
            className="w-full py-4 px-6 font-semibold rounded-xl transition-colors"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            Create a Poll
          </button>

          {recentPolls.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Your recent polls</p>
              <div className="space-y-2">
                {recentPolls.map(poll => (
                  <button
                    key={poll.id}
                    onClick={() => router.push(`/host?p=${btoa(JSON.stringify(poll))}`)}
                    className="w-full text-left px-4 py-3 rounded-xl transition-colors"
                    style={{ backgroundColor: 'var(--bg)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                  >
                    <p className="font-medium truncate" style={{ color: 'var(--text)' }}>{poll.title}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{poll.id}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
          Polls are stored in your browser. Keep your poll links safe!
        </p>
      </div>
    </div>
  )
}