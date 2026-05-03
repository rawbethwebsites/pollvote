'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Poll, checkPollExpiry, closePoll, updatePoll, buildVoteUrl, buildResultsUrl, saveHostPoll } from '@/lib/polls'

function HostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [copied, setCopied] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editQuestions, setEditQuestions] = useState<{ text: string; options: string[] }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)

  // Load poll from URL
  useEffect(() => {
    const encoded = searchParams.get('p')
    if (encoded) {
      try {
        const decoded = JSON.parse(atob(encoded))
        setPoll(checkPollExpiry(decoded))
      } catch {
        router.push('/')
      }
    } else {
      router.push('/')
    }
  }, [searchParams, router])

  // Timer and auto-expiry check
  useEffect(() => {
    if (!poll) return

    const tick = () => {
      setPoll(current => {
        if (!current) return null
        const updated = checkPollExpiry(current)
        setRemainingSeconds(
          updated.isActive && updated.endsAt
            ? Math.max(0, Math.floor((new Date(updated.endsAt).getTime() - Date.now()) / 1000))
            : null
        )
        return updated
      })
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [poll])

  const handleClose = () => {
    if (!poll) return
    const closed = closePoll(poll)
    setPoll(closed)
    saveHostPoll(closed)
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

  const getResults = () => {
    if (!poll) return { questionResults: [], totalVotes: 0 }
    const questionResults = poll.questions.map(q => {
      const totalVotes = Object.values(poll.votes[q.id] || {}).flat().length
      return {
        questionId: q.id,
        questionText: q.text,
        results: (q.options || []).map(opt => ({
          option: opt,
          count: poll.votes[q.id]?.[opt]?.length || 0,
          percentage: totalVotes === 0 ? 0 : Math.round(((poll.votes[q.id]?.[opt]?.length || 0) / totalVotes) * 100)
        })),
        totalVotes
      }
    })
    return {
      questionResults,
      totalVotes: questionResults.reduce((sum, q) => sum + q.totalVotes, 0)
    }
  }

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

  const saveEdits = () => {
    if (!poll || !editTitle.trim()) return

    const validQuestions = editQuestions.filter(q =>
      q.text.trim() && q.options.filter(o => o.trim()).length >= 2
    )

    if (validQuestions.length === 0) {
      setEditError('At least one question with 2+ options required')
      return
    }

    const updated = updatePoll(poll, editTitle.trim(), validQuestions)
    if (!updated) {
      setEditError('Cannot edit - votes already exist')
      return
    }

    setPoll(updated)
    saveHostPoll(updated)
    setIsEditing(false)
    setEditError('')
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    )
  }

  const { questionResults, totalVotes } = getResults()
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const voteLink = buildVoteUrl(baseUrl, poll)
  const resultsLink = buildResultsUrl(baseUrl, poll)

  // Edit Mode
  if (isEditing) {
    return (
      <div className="min-h-screen bg-bg py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={cancelEditing} className="mb-8 text-text-muted hover:text-text flex items-center gap-2">
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
                        <button type="button" onClick={() => removeEditOption(qIndex, oIndex)} className="px-3 text-text-muted hover:text-error">×</button>
                      )}
                    </div>
                  ))}
                </div>
                {question.options.length < 10 && (
                  <button type="button" onClick={() => addEditOption(qIndex)} className="mt-2 text-sm text-primary hover:text-primary-hover">+ Add option</button>
                )}
              </div>
            ))}

            {editError && <p className="text-error text-center">{editError}</p>}

            <button
              onClick={saveEdits}
              className="w-full py-4 px-6 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/')} className="mb-8 text-text-muted hover:text-text flex items-center gap-2">
          <span>←</span> Back to Home
        </button>

        {/* Header */}
        <div className="bg-surface rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {poll.isActive ? (
                <div className="px-3 py-1 bg-success/10 text-success text-sm font-medium rounded-full">Live</div>
              ) : (
                <div className="px-3 py-1 bg-text-muted/10 text-text-muted text-sm font-medium rounded-full">Closed</div>
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

          <div className="flex gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors"
            >
              Share Poll
            </button>
            {poll.isActive && (
              <button
                onClick={startEditing}
                className="px-6 py-3 border border-border hover:bg-bg text-text font-medium rounded-xl transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface rounded-2xl shadow-lg p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text">Share Your Poll</h2>
                <button onClick={() => setShowShareModal(false)} className="text-text-muted hover:text-text">×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Voting link</label>
                  <div className="flex gap-2">
                    <input type="text" value={voteLink} readOnly className="flex-1 px-4 py-3 border border-border rounded-xl bg-bg text-sm font-mono" />
                    <button
                      onClick={() => copyToClipboard(voteLink, 'vote')}
                      className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl"
                    >
                      {copied === 'vote' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Results link</label>
                  <div className="flex gap-2">
                    <input type="text" value={resultsLink} readOnly className="flex-1 px-4 py-3 border border-border rounded-xl bg-bg text-sm font-mono" />
                    <button
                      onClick={() => copyToClipboard(resultsLink, 'results')}
                      className="px-6 py-3 border border-border hover:bg-bg text-text font-medium rounded-xl"
                    >
                      {copied === 'results' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-6">
          {questionResults.map((qr, qIndex) => {
            const maxCount = Math.max(...qr.results.map(r => r.count), 1)
            return (
              <div key={qr.questionId} className="bg-surface rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-text">Q{qIndex + 1}: {qr.questionText}</h2>
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
                        <span className="text-text-muted text-sm">{result.count} ({result.percentage}%)</span>
                      </div>
                      <div className="h-6 bg-bg rounded-lg overflow-hidden">
                        <div className="h-full bg-primary rounded-lg" style={{ width: `${(result.count / maxCount) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 bg-surface rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Total votes</p>
              <p className="text-3xl font-bold text-primary">{totalVotes}</p>
            </div>
            {poll.isActive && (
              <button onClick={handleClose} className="px-6 py-3 border border-error text-error hover:bg-error/5 font-medium rounded-xl">
                Close Poll
              </button>
            )}
          </div>
          {!poll.isActive && <p className="text-center text-text-muted mt-4">This poll is closed</p>}
        </div>
      </div>
    </div>
  )
}

export default function HostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg flex items-center justify-center"><div className="text-text-muted">Loading...</div></div>}>
      <HostContent />
    </Suspense>
  )
}