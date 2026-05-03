'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface QuestionResult {
  questionId: string
  questionText: string
  results: { option: string; count: number; percentage: number }[]
  totalVotes: number
}

interface Poll {
  id: string
  title: string
  isActive: boolean
  isAnonymous: boolean
  endsAt: string | null
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = () => {
      fetch(`/api/polls/${params.id}/results`)
        .then(res => {
          if (!res.ok) throw new Error('Poll not found')
          return res.json()
        })
        .then(data => {
          setPoll(data.poll)
          setQuestionResults(data.questionResults)
          setRemainingSeconds(data.remainingSeconds)
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    }

    fetchResults()
    const interval = setInterval(fetchResults, 1000)
    return () => clearInterval(interval)
  }, [params.id])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted">Loading results...</div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-error text-lg mb-4">Poll not found</p>
          <button onClick={() => router.push('/')} className="text-primary hover:underline">
            Go back home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push('/')} className="mb-8 text-text-muted hover:text-text">
          ← Back
        </button>

        {/* Header */}
        <div className="bg-surface rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {poll.isActive ? (
                  <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
                    Live
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-text-muted/10 text-text-muted text-sm font-medium rounded-full">
                    Closed
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold text-text">{poll.title}</h1>
            </div>

            {remainingSeconds !== null && remainingSeconds > 0 && poll.isActive && (
              <div className="text-2xl font-mono font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl">
                {formatTime(remainingSeconds)}
              </div>
            )}
          </div>

          <div className="text-center py-4">
            <div className="text-4xl font-bold text-primary">
              {questionResults.reduce((sum, q) => sum + q.totalVotes, 0)}
            </div>
            <div className="text-text-muted">total votes</div>
          </div>
        </div>

        {/* Results per Question */}
        <div className="space-y-6">
          {questionResults.map((qr, qIndex) => {
            const maxCount = Math.max(...qr.results.map(r => r.count), 1)

            return (
              <div key={qr.questionId} className="bg-surface rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-text">
                    Q{qIndex + 1}: {qr.questionText}
                  </h2>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{qr.totalVotes}</div>
                    <div className="text-xs text-text-muted">{qr.totalVotes === 1 ? 'vote' : 'votes'}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {qr.results.map((result) => (
                    <div key={result.option}>
                      <div className="flex justify-between mb-1">
                        <span className="text-text">{result.option}</span>
                        <span className="text-text-muted text-sm">
                          {result.count} ({result.percentage}%)
                        </span>
                      </div>
                      <div className="h-6 bg-bg rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-lg transition-all duration-500 ease-out"
                          style={{ width: `${(result.count / maxCount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 text-center text-sm text-text-muted">
          Poll ID: <span className="font-mono">{params.id}</span>
        </div>
      </div>
    </div>
  )
}