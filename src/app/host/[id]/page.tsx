'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  text: string
  options: string[]
}

interface QuestionResult {
  questionId: string
  questionText: string
  results: { option: string; count: number; percentage: number }[]
  totalVotes: number
}

interface Poll {
  id: string
  title: string
  questions: Question[]
  isActive: boolean
  isAnonymous: boolean
  endsAt: string | null
}

export default function HostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [copied, setCopied] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editQuestions, setEditQuestions] = useState<{ text: string; options: string[] }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')

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

  const startEditing = () => {
    if (!poll) return
    setEditTitle(poll.title)
    setEditQuestions(poll.questions.map(q => ({ text: q.text, options: [...q.options] })))
    setIsEditing(true)
    setEditError('')
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditError('')
  }

  const updateEditQuestion = (index: number, text: string) => {
    const updated = [...editQuestions]
    updated[index].text = text
    setEditQuestions(updated)
  }

  const updateEditOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...editQuestions]
    updated[qIndex].options[oIndex] = value
    setEditQuestions(updated)
  }

  const addEditOption = (qIndex: number) => {
    const updated = [...editQuestions]
    if (updated[qIndex].options.length < 10) {
      updated[qIndex].options.push('')
      setEditQuestions(updated)
    }
  }

  const removeEditOption = (qIndex: number, oIndex: number) => {
    const updated = [...editQuestions]
    if (updated[qIndex].options.length > 2) {
      updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex)
      setEditQuestions(updated)
    }
  }

  const saveEdits = async () => {
    if (!editTitle.trim()) return

    const validQuestions = editQuestions.filter(q =>
      q.text.trim() && q.options.filter(o => o.trim()).length >= 2
    )

    if (validQuestions.length === 0) {
      setEditError('At least one question with 2+ options required')
      return
    }

    setIsSaving(true)
    setEditError('')

    try {
      const res = await fetch(`/api/polls/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          questions: validQuestions.map(q => ({
            text: q.text.trim(),
            options: q.options.filter(o => o.trim())
          }))
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setPoll(updated)
        setIsEditing(false)
        setEditQuestions([])
      } else {
        const data = await res.json()
        setEditError(data.error || 'Failed to update poll')
      }
    } catch {
      setEditError('Failed to update poll')
    }

    setIsSaving(false)
  }

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

  // Edit Mode
  if (isEditing) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={cancelEditing}
            className="mb-8 text-text-muted hover:text-text flex items-center gap-2"
          >
            <span>←</span> Cancel
          </button>

          <h1 className="text-3xl font-bold text-text mb-8">Edit Poll</h1>

          <div className="space-y-6">
            <div className="bg-surface rounded-2xl shadow-lg p-8">
              <label className="block text-sm font-medium text-text mb-2">Poll Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {editQuestions.map((question, qIndex) => (
              <div key={qIndex} className="bg-surface rounded-2xl shadow-lg p-6">
                <span className="text-sm font-medium text-text-muted">Question {qIndex + 1}</span>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateEditQuestion(qIndex, e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary mt-2 mb-4"
                />

                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateEditOption(qIndex, oIndex, e.target.value)}
                        className="flex-1 px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEditOption(qIndex, oIndex)}
                          className="px-3 text-text-muted hover:text-error"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {question.options.length < 10 && (
                  <button
                    type="button"
                    onClick={() => addEditOption(qIndex)}
                    className="mt-2 text-sm text-primary hover:text-primary-hover"
                  >
                    + Add option
                  </button>
                )}
              </div>
            ))}

            {editError && <p className="text-error text-center">{editError}</p>}

            <button
              onClick={saveEdits}
              disabled={isSaving}
              className="w-full py-4 px-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-text-muted hover:text-text flex items-center gap-2"
        >
          <span>←</span> Back to Home
        </button>

        {/* Poll Header */}
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

            {poll.isActive && (
              <button
                onClick={startEditing}
                className="w-full py-2 border border-border hover:bg-bg text-text font-medium rounded-xl transition-colors"
              >
                Edit Poll
              </button>
            )}
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

        {/* Total and Close */}
        <div className="mt-6 bg-surface rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Total votes across all questions</p>
              <p className="text-3xl font-bold text-primary">
                {questionResults.reduce((sum, q) => sum + q.totalVotes, 0)}
              </p>
            </div>

            {poll.isActive && (
              <button
                onClick={handleClosePoll}
                className="px-6 py-3 border border-error text-error hover:bg-error/5 font-medium rounded-xl transition-colors"
              >
                Close Poll
              </button>
            )}
          </div>

          {!poll.isActive && (
            <p className="text-center text-text-muted mt-4">This poll is closed</p>
          )}
        </div>
      </div>
    </div>
  )
}