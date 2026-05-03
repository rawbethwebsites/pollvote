'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [pollId, setPollId] = useState('')

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pollId.trim()) {
      router.push(`/join/${pollId.trim()}`)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-text mb-4">PollVote</h1>
          <p className="text-xl text-text-muted">Real-time voting, made simple</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-lg p-8 space-y-6">
          <button
            onClick={() => router.push('/create')}
            className="w-full py-4 px-6 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
          >
            Create a Poll
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface text-text-muted">or join a poll</span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="flex gap-3">
            <input
              type="text"
              value={pollId}
              onChange={(e) => setPollId(e.target.value.toUpperCase())}
              placeholder="Enter poll ID"
              className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}