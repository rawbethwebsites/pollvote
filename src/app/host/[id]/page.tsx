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
  endsAt: string | null
  votes: Record<string, string[]>
}

export default function HostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [copied, setCopied] = useState('')
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

  const handleClosePoll = async () => {
    await fetch(`/api/polls/${params.id}/close`, { method: 'POST' })
    window.location.reload()
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(''), 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const shareLink = `http://localhost:3000/vote/${params.id}?name=YOUR_NAME`
  const resultsLink = `http://localhost:3000/results/${params.id}`

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
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
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-text-muted hover:text-text flex items-center gap-2"
        >
          <span>←</span> Back to Home
        </button>

        {/* Poll ID Card */}
        <div className="bg-surface rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {poll.isActive ? (
                <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">
                  Live
                </div>
              ) : (
                <div className="px-3 py-1 bg-text-muted/10 text-text-muted text-sm font-medium rounded-full">
                  Closed
                </div>
              )}
              <h1 className="text-2xl font-bold text-text">{poll.title}</h1>
            </div>

            {remainingSeconds !== null && remainingSeconds > 0 && poll.isActive && (
              <div className="text-2xl font-mono font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl">
                {formatTime(remainingSeconds)}
              </div>
            )}
          </div>

          <div className="bg-bg rounded-xl p-6 text-center mb-6">
            <p className="text-sm text-text-muted mb-2">Poll ID</p>
            <p className="text-4xl font-mono font-bold text-primary tracking-wider">{poll.id}</p>
          </div>

          {/* Share Links */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Share this link with voters</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-border rounded-xl bg-bg text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(shareLink, 'link')}
                  className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
                >
                  {copied === 'link' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">View results</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resultsLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-border rounded-xl bg-bg text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(resultsLink, 'results')}
                  className="px-6 py-3 border border-border hover:bg-bg text-text font-medium rounded-xl transition-colors"
                >
                  {copied === 'results' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="bg-surface rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text">Live Results</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalVotes}</div>
              <div className="text-sm text-text-muted">{totalVotes === 1 ? 'vote' : 'votes'}</div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {results.map((result) => (
              <div key={result.option} className="relative">
                <div className="flex justify-between mb-1">
                  <span className="text-text font-medium">{result.option}</span>
                  <span className="text-text-muted text-sm">
                    {result.count} {result.count === 1 ? 'vote' : 'votes'} ({result.percentage}%)
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

          {!poll.isActive && (
            <p className="text-center text-text-muted">This poll is closed</p>
          )}
        </div>
      </div>
    </div>
  )
}