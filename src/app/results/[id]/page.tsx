'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Result {
  option: string
  count: number
  percentage: number
}

interface Poll {
  id: string
  title: string
  options: string[]
  isActive: boolean
  isAnonymous: boolean
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
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
          setResults(data.results)
          setTotalVotes(data.totalVotes)
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    }

    fetchResults()
    const interval = setInterval(fetchResults, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  const handleClosePoll = async () => {
    await fetch(`/api/polls/${params.id}/close`, { method: 'POST' })
    window.location.reload()
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

  const maxCount = Math.max(...results.map(r => r.count), 1)

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-text-muted hover:text-text flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <div className="bg-surface rounded-2xl shadow-lg p-8">
          <div className="flex items-start justify-between mb-8">
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
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
              }}
              className="px-4 py-2 text-sm text-text-muted hover:text-text border border-border rounded-lg"
            >
              Share
            </button>
          </div>

          <div className="mb-6 text-center">
            <div className="text-4xl font-bold text-primary">{totalVotes}</div>
            <div className="text-text-muted">{totalVotes === 1 ? 'vote' : 'votes'}</div>
          </div>

          <div className="space-y-4 mb-8">
            {results.map((result) => (
              <div key={result.option} className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-text font-medium">{result.option}</span>
                  <span className="text-text-muted text-sm">
                    {result.count} ({result.percentage}%)
                  </span>
                </div>
                <div className="h-8 bg-bg rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-lg transition-all duration-500 ease-out"
                    style={{ width: `${(result.count / maxCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {poll.isActive && (
            <button
              onClick={handleClosePoll}
              className="w-full py-3 px-6 border border-error text-error hover:bg-error/5 font-medium rounded-xl transition-colors"
            >
              Close Poll
            </button>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-text-muted">
          Poll ID: <span className="font-mono">{params.id}</span>
        </div>
      </div>
    </div>
  )
}