'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Poll {
  id: string
  title: string
  options: string[]
  isActive: boolean
}

export default function JoinPoll({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [poll, setPoll] = useState<Poll | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/polls/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Poll not found')
        return res.json()
      })
      .then(data => {
        setPoll(data)
        setIsLoading(false)
      })
      .catch(() => {
        setError('Poll not found')
        setIsLoading(false)
      })
  }, [params.id])

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !poll) return
    router.push(`/vote/${poll.id}?name=${encodeURIComponent(name.trim())}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-error text-lg mb-4">{error || 'Poll not found'}</p>
          <button onClick={() => router.push('/')} className="text-primary hover:underline">
            Go back home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-text-muted hover:text-text flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <div className="bg-surface rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full mb-4">
              Live Poll
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">{poll.title}</h1>
            <p className="text-text-muted">Enter your name to join and vote</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 px-6 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
            >
              Join Poll
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-muted">
            Poll ID: <span className="font-mono font-medium">{params.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}