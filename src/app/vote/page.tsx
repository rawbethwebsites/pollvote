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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: 'var(--error)' }}>{error || 'Poll not found'}</p>
          <button onClick={() => router.push('/')} className="hover:underline" style={{ color: 'var(--primary)' }}>Go to home</button>
        </div>
      </div>
    )
  }

  const currentQuestion = poll.questions[currentQIndex]
  const allVoted = poll.questions.every(q => votedQuestions.has(q.id))

  if (showAllResults || allVoted) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return (
      <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl shadow-lg p-8 text-center" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Vote Submitted!</h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>You answered {poll.questions.length} questions</p>
            <button
              onClick={() => router.push(`/results?p=${btoa(JSON.stringify(poll))}`)}
              className="px-6 py-3 font-semibold rounded-xl transition-colors"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Voting Closed</h2>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>This poll is no longer accepting votes</p>
          <button
            onClick={() => router.push(`/results?p=${btoa(JSON.stringify(poll))}`)}
            className="px-6 py-3 font-semibold rounded-xl transition-colors"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            View Results
          </button>
        </div>
      </div>
    )
  }

  if (!voterName) {
    return (
      <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-xl mx-auto">
          <button onClick={() => router.push('/')} className="mb-8" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >← Back</button>
          <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{poll.title}</h1>
              <p style={{ color: 'var(--text-muted)' }}>Enter your name to join and vote</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Your Name</label>
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 mb-4"
                style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                autoFocus
              />
              <button
                onClick={() => {
                  if (voterName.trim()) {
                    setVotedQuestions(new Set())
                  }
                }}
                disabled={!voterName.trim()}
                className="w-full py-4 px-6 font-semibold rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                onMouseEnter={(e) => { if (voterName.trim()) e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
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
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 text-sm font-medium rounded-full" style={{ backgroundColor: 'var(--success)', color: 'white' }}>Live</div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Question {currentQIndex + 1} of {poll.questions.length}</span>
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{poll.title}</h1>
          <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Voting as <span className="font-medium" style={{ color: 'var(--text)' }}>{voterName}</span></p>

          {currentQuestion && (
            <>
              <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>{currentQuestion.text}</h2>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedOption(option)}
                    className="w-full p-4 text-left rounded-xl border-2 transition-all"
                    style={selectedOption === option
                      ? { borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', color: 'var(--text)' }
                      : { borderColor: 'var(--border)', color: 'var(--text)' }
                    }
                    onMouseEnter={(e) => { if (selectedOption !== option) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={(e) => { if (selectedOption !== option) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <span className="font-medium">{option}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleVote}
                disabled={!selectedOption || isSubmitting}
                className="w-full py-4 px-6 font-semibold rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                onMouseEnter={(e) => { if (!isSubmitting && selectedOption) e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
              >
                {isSubmitting ? 'Submitting...' : currentQIndex < poll.questions.length - 1 ? 'Next Question' : 'Finish Voting'}
              </button>

              {votedQuestions.has(currentQuestion.id) && (
                <p className="text-center mt-4" style={{ color: 'var(--success)' }}>Answer recorded!</p>
              )}
            </>
          )}

          {error && <p className="mt-4 text-center" style={{ color: 'var(--error)' }}>{error}</p>}
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