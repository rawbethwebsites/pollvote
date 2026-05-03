'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Question {
  id: string
  text: string
  options: string[]
}

interface Poll {
  id: string
  title: string
  questions: Question[]
  isActive: boolean
  isAnonymous: boolean
  endsAt: string | null
}

export default function VotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const voterName = searchParams.get('name') || ''

  const [poll, setPoll] = useState<Poll | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState('')
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAllResults, setShowAllResults] = useState(false)

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
    if (!selectedOption || !voterName || !poll) return

    const question = poll.questions[currentQIndex]
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/polls/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          option: selectedOption,
          voterName
        })
      })

      if (res.ok) {
        const newVoted = new Set(votedQuestions)
        newVoted.add(question.id)
        setVotedQuestions(newVoted)

        if (currentQIndex < poll.questions.length - 1) {
          setCurrentQIndex(currentQIndex + 1)
          setSelectedOption('')
        } else {
          setShowAllResults(true)
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit vote')
      }
    } catch {
      setError('Failed to submit vote')
    }
    setIsSubmitting(false)
  }

  const currentQuestion = poll?.questions[currentQIndex]
  const allVoted = poll ? votedQuestions.size === poll.questions.length : false

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

  if (!voterName) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4">
        <div className="max-w-xl mx-auto">
          <button onClick={() => router.push('/')} className="mb-8 text-text-muted hover:text-text">
            ← Back
          </button>
          <div className="bg-surface rounded-2xl shadow-lg p-8 text-center">
            <p className="text-text-muted mb-4">Enter your name in the URL to vote</p>
            <p className="text-sm font-mono bg-bg px-4 py-2 rounded">
              {window.location.origin}/vote/{params.id}?name=YourName
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showAllResults || allVoted) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4">
        <div className="max-w-xl mx-auto">
          <button onClick={() => router.push('/')} className="mb-8 text-text-muted hover:text-text">
            ← Back
          </button>
          <div className="bg-surface rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-text mb-2">Vote Submitted!</h2>
            <p className="text-text-muted mb-6">You answered {poll.questions.length} questions</p>
            <button
              onClick={() => router.push(`/results/${params.id}`)}
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
            onClick={() => router.push(`/results/${params.id}`)}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
          >
            View Results
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-surface rounded-2xl shadow-lg p-8">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
              Live
            </div>
            <span className="text-sm text-text-muted">
              Question {currentQIndex + 1} of {poll.questions.length}
            </span>
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
                {isSubmitting
                  ? 'Submitting...'
                  : currentQIndex < poll.questions.length - 1
                  ? 'Next Question'
                  : 'Finish Voting'}
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