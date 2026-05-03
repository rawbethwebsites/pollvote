'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPoll, saveHostPoll, buildHostUrl } from '@/lib/polls'

export default function CreatePoll() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<{ text: string; options: string[] }[]>([
    { text: '', options: ['', ''] }
  ])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [duration, setDuration] = useState<number | null>(5)
  const [isLoading, setIsLoading] = useState(false)

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', ''] }])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index))
    }
  }

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions]
    updated[index].text = text
    setQuestions(updated)
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions]
    updated[qIndex].options[oIndex] = value
    setQuestions(updated)
  }

  const addOption = (qIndex: number) => {
    const updated = [...questions]
    if (updated[qIndex].options.length < 10) {
      updated[qIndex].options.push('')
      setQuestions(updated)
    }
  }

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions]
    if (updated[qIndex].options.length > 2) {
      updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex)
      setQuestions(updated)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) return

    const validQuestions = questions.filter(q =>
      q.text.trim() && q.options.filter(o => o.trim()).length >= 2
    )

    if (validQuestions.length === 0) return

    setIsLoading(true)

    const poll = createPoll(
      title.trim(),
      validQuestions.map(q => ({
        text: q.text.trim(),
        options: q.options.filter(o => o.trim())
      })),
      isAnonymous,
      duration
    )

    // Save to localStorage
    saveHostPoll(poll)

    // Navigate to host dashboard
    const encoded = btoa(JSON.stringify(poll))
    router.push(`/host?p=${encoded}`)
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 flex items-center gap-2"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>Create a Poll</h1>

        <div className="space-y-6">
          {/* Title */}
          <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: 'var(--surface)' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Poll Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this poll about?"
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2"
              style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="rounded-2xl shadow-lg p-6" style={{ backgroundColor: 'var(--surface)' }}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Question {qIndex + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-sm"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                  placeholder="Enter your question"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 mb-4"
                  style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                />

                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1 px-4 py-2 rounded-xl focus:outline-none focus:ring-2"
                        style={{ borderColor: 'var(--border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
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
                    onClick={() => addOption(qIndex)}
                    className="mt-2 text-sm"
                    style={{ color: 'var(--primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  >
                    + Add option
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 rounded-xl transition-colors"
            style={{ borderColor: 'var(--border)', borderWidth: '2px', borderStyle: 'dashed', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            + Add another question
          </button>

          {/* Settings */}
          <div className="rounded-2xl shadow-lg p-8 space-y-6" style={{ backgroundColor: 'var(--surface)' }}>
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>Poll Duration</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 5, 10, 15].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className="px-4 py-2 rounded-xl border-2 transition-all"
                    style={duration === mins
                      ? { borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', color: 'white' }
                      : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
                    }
                    onMouseEnter={(e) => { if (duration !== mins) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={(e) => { if (duration !== mins) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    {mins} min
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDuration(null)}
                  className="px-4 py-2 rounded-xl border-2 transition-all"
                  style={duration === null
                    ? { borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', color: 'white' }
                    : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
                  }
                  onMouseEnter={(e) => { if (duration !== null) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { if (duration !== null) e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  No limit
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 rounded"
                style={{ accentColor: 'var(--primary)' }}
              />
              <label htmlFor="anonymous" className="text-sm" style={{ color: 'var(--text)' }}>
                Enable anonymous voting (voter names hidden)
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim()}
            className="w-full py-4 px-6 font-semibold rounded-xl transition-colors"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            onMouseEnter={(e) => { if (!isLoading && title.trim()) e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            {isLoading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </div>
    </div>
  )
}