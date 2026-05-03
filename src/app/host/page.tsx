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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
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
      <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={cancelEditing} className="mb-8 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <span>←</span> Cancel
          </button>

          <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>Edit Poll</h1>

          <div className="space-y-6">
            <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--surface)' }}>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Poll Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>

            {editQuestions.map((question, qIndex) => (
              <div key={qIndex} className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--surface)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Question {qIndex + 1}</span>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateEditQuestion(qIndex, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 mt-2 mb-4"
                  style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                />
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateEditOption(qIndex, oIndex, e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl focus:outline-none focus:ring-2"
                        style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                      />
                      {question.options.length > 2 && (
                        <button type="button" onClick={() => removeEditOption(qIndex, oIndex)} style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >×</button>
                      )}
                    </div>
                  ))}
                </div>
                {question.options.length < 10 && (
                  <button type="button" onClick={() => addEditOption(qIndex)} className="mt-2 text-sm" style={{ color: 'var(--primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  >+ Add option</button>
                )}
              </div>
            ))}

            {editError && <p style={{ color: 'var(--error)', textAlign: 'center' }}>{editError}</p>}

            <button
              onClick={saveEdits}
              className="w-full py-4 px-6 font-semibold rounded-xl transition-colors"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/')} className="mb-8 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <span>←</span> Back to Home
        </button>

        {/* Header */}
        <div className="rounded-2xl shadow-lg p-8 mb-6" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {poll.isActive ? (
                <div className="px-3 py-1 text-sm font-medium rounded-full" style={{ backgroundColor: 'var(--success)', color: 'white' }}>Live</div>
              ) : (
                <div className="px-3 py-1 text-sm font-medium rounded-full" style={{ backgroundColor: 'var(--text-muted)', color: 'white' }}>Closed</div>
              )}
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{poll.title}</h1>
            </div>
            {remainingSeconds !== null && remainingSeconds > 0 && poll.isActive && (
              <div className="font-mono font-bold px-4 py-2 rounded-xl" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                {formatTime(remainingSeconds)}
              </div>
            )}
          </div>

          <div className="rounded-xl p-6 text-center mb-6" style={{ backgroundColor: 'var(--bg)' }}>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Poll ID</p>
            <p className="text-4xl font-mono font-bold tracking-wider" style={{ color: 'var(--primary)' }}>{poll.id}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex-1 py-3 font-semibold rounded-xl transition-colors"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              Share Poll
            </button>
            {poll.isActive && (
              <button
                onClick={startEditing}
                className="px-6 py-3 font-medium rounded-xl transition-colors"
                style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', color: 'var(--text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="rounded-2xl shadow-lg p-8 max-w-md w-full" style={{ backgroundColor: 'var(--surface)' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Share Your Poll</h2>
                <button onClick={() => setShowShareModal(false)} style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >×</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Voting link</label>
                  <div className="flex gap-2">
                    <input type="text" value={voteLink} readOnly className="flex-1 px-4 py-3 rounded-xl text-sm font-mono" style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                    <button
                      onClick={() => copyToClipboard(voteLink, 'vote')}
                      className="px-6 py-3 font-semibold rounded-xl"
                      style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                    >
                      {copied === 'vote' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Results link</label>
                  <div className="flex gap-2">
                    <input type="text" value={resultsLink} readOnly className="flex-1 px-4 py-3 rounded-xl text-sm font-mono" style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }} />
                    <button
                      onClick={() => copyToClipboard(resultsLink, 'results')}
                      className="px-6 py-3 font-medium rounded-xl"
                      style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', color: 'var(--text)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
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
              <div key={qr.questionId} className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--surface)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Q{qIndex + 1}: {qr.questionText}</h2>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{qr.totalVotes}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{qr.totalVotes === 1 ? 'vote' : 'votes'}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {qr.results.map((result) => (
                    <div key={result.option}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'var(--text)' }}>{result.option}</span>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{result.count} ({result.percentage}%)</span>
                      </div>
                      <div className="h-6 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
                        <div className="h-full rounded-lg" style={{ backgroundColor: 'var(--primary)', width: `${(result.count / maxCount) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total votes</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{totalVotes}</p>
            </div>
            {poll.isActive && (
              <button onClick={handleClose} className="px-6 py-3 font-medium rounded-xl"
                style={{ borderColor: 'var(--error)', borderWidth: '1px', borderStyle: 'solid', color: 'var(--error)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--error)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Close Poll
              </button>
            )}
          </div>
          {!poll.isActive && <p className="text-center mt-4" style={{ color: 'var(--text-muted)' }}>This poll is closed</p>}
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