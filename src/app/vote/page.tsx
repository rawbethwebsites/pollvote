'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Poll, checkPollExpiry, castVote, buildResultsUrl } from '@/lib/polls'

function VoteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [voterName, setVoterName] = useState('')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState('')
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAllResults, setShowAllResults] = useState(false)

  useEffect(() => {
    const encoded = searchParams.get('p')
    if (encoded) {
      try {
        const decoded = JSON.parse(atob(encoded))
        const checked = checkPollExpiry(decoded)
        setPoll(checked)
        setIsLoading(false)
      } catch {
        setError('Invalid poll link')
        setIsLoading(false)
      }
    } else {
      setError('No poll found')
      setIsLoading(false)
    }
  }, [searchParams])

  const handleVote = () => {
    if (!poll || !selectedOption || !voterName.trim()) return

    const question = poll.questions[currentQIndex]
    const updated = castVote(poll, question.id, selectedOption, voterName.trim())
    setPoll(updated)

    const newVoted = new Set(votedQuestions)
    newVoted.add(question.id)
    setVotedQuestions(newVoted)

    if (currentQIndex < poll.questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1)
      setSelectedOption('')
    } else {
      setShowAllResults(true)
    }
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
          <button onClick={() => router.push('/')} className="text-primary hover:underline">Go to home</button>
        </div>
      </div>
    )
  }

  const currentQuestion = poll.questions[currentQIndex]
  const allVoted = poll.questions.every(q => votedQuestions.has(q.id))

  if (showAllResults || allVoted) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return (
      <div className="min-h-screen bg-bg py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-surface rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-text mb-2">Vote Submitted!</h2>
            <p className="text-text-muted mb-6">You answered {poll.questions.length} questions</p>
            <button
              onClick={() => router.push(`/results?p=${btoa(JSON.stringify(poll))}`)}
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
            >
              View Results
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!poll.isActive) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-text mb-2">Voting Closed</h2>
          <p className="text-text-muted mb-6">This poll is no longer accepting votes</p>
          <button
            onClick={() => router.push(`/results?p=${btoa(JSON.stringify(poll))}`)}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
          >
            View Results
          </button>
        </div>
      </div>
    )
  }

  if (!voterName) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4">
        <div className="max-w-xl mx-auto">
          <button onClick={() => router.push('/')} className="mb-8 text-text-muted hover:text-text">← Back</button>
          <div className="bg-surface rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-text mb-2">{poll.title}</h1>
              <p className="text-text-muted">Enter your name to join and vote</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Your Name</label>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                autoFocus
              />
              <button
                onClick={() => {
                  if (voterName.trim()) {
                    setVotedQuestions(new Set())
                  }
                }}
                disabled={!voterName.trim()}
                className="w-full py-4 px-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                Join Poll
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-surface rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">Live</div>
            <span className="text-sm text-text-muted">Question {currentQIndex + 1} of {poll.questions.length}</span>
          </div>

          <h1 className="text-2xl font-bold text-text mb-2">{poll.title}</h1>
          <p className="text-text-muted mb-6">Voting as <span className="font-medium">{voterName}</span></p>

          {currentQuestion && (
            <>
              <h2 className="text-xl font-semibold text-text mb-6">{currentQuestion.text}</h2>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option) => (
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

              <button
                onClick={handleVote}
                disabled={!selectedOption || isSubmitting}
                className="w-full py-4 px-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {isSubmitting ? 'Submitting...' : currentQIndex < poll.questions.length - 1 ? 'Next Question' : 'Finish Voting'}
              </button>

              {votedQuestions.has(currentQuestion.id) && (
                <p className="text-center text-success mt-4">Answer recorded!</p>
              )}
            </>
          )}

          {error && <p className="mt-4 text-center text-error">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default function VotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="text-text-muted">Loading...</div></div>}>
      <VoteContent />
    </Suspense>
  )
}