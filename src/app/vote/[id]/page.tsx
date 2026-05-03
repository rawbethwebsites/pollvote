'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Poll {
  id: string
  title: string
  options: string[]
  isActive: boolean
  isAnonymous: boolean
}

export default function VotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const voterName = searchParams.get('name') || ''

  const [poll, setPoll] = useState<Poll | null>(null)
  const [selectedOption, setSelectedOption] = useState('')
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const handleVote = async () => {
    if (!selectedOption || !voterName) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/polls/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: selectedOption, voterName })
      })

      if (res.ok) {
        setHasVoted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit vote')
      }
    } catch {
      setError('Failed to submit vote')
    }
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    )
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-error text-lg mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="text-primary hover:underline">
            Go back home
          </button>
        </div>
      </div>
    )
  }

  if (!poll) return null

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-surface rounded-2xl shadow-lg p-8">
          {hasVoted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-text mb-2">Vote Submitted!</h2>
              <p className="text-text-muted mb-6">Your vote has been recorded</p>
              <button
                onClick={() => router.push(`/results/${params.id}`)}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
              >
                View Results
              </button>
            </div>
          ) : poll.isActive ? (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
                    Live
                  </div>
                  <span className="text-sm text-text-muted">Voting is open</span>
                </div>
                <h1 className="text-2xl font-bold text-text mb-2">{poll.title}</h1>
                {voterName && (
                  <p className="text-text-muted">Voting as <span className="font-medium">{voterName}</span></p>
                )}
              </div>

              <div className="space-y-3 mb-8">
                {poll.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      selectedOption === option
                        ? 'border-primary bg-primary/5 text-text'
                        : 'border-border hover:border-primary/50 text-text'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </button>
                ))}
              </div>

              {voterName ? (
                <button
                  onClick={handleVote}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full py-4 px-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                </button>
              ) : (
                <p className="text-center text-text-muted py-4">
                  Go back and enter your name to vote
                </p>
              )}

              {error && <p className="mt-4 text-center text-error">{error}</p>}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold text-text mb-2">Voting Closed</h2>
              <p className="text-text-muted mb-6">This poll is no longer accepting votes</p>
              <button
                onClick={() => router.push(`/results/${params.id}`)}
                className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
              >
                View Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}