'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuestionInput {
  text: string
  options: string[]
}

export default function CreatePoll() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuestionInput[]>([
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const validQuestions = questions.filter(q =>
      q.text.trim() && q.options.filter(o => o.trim()).length >= 2
    )

    if (validQuestions.length === 0) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          questions: validQuestions.map(q => ({
            text: q.text.trim(),
            options: q.options.filter(o => o.trim())
          })),
          isAnonymous,
          durationMinutes: duration
        })
      })
      const poll = await res.json()
      router.push(`/host/${poll.id}`)
    } catch (error) {
      console.error('Failed to create poll:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-text-muted hover:text-text flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl font-bold text-text mb-8">Create a Poll</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-surface rounded-2xl shadow-lg p-8">
            <label className="block text-sm font-medium text-text mb-2">Poll Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this poll about?"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-surface rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-text-muted">Question {qIndex + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-text-muted hover:text-error text-sm"
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
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                />

                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1 px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, oIndex)}
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
                    onClick={() => addOption(qIndex)}
                    className="mt-2 text-sm text-primary hover:text-primary-hover"
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
            className="w-full py-3 border-2 border-dashed border-border rounded-xl text-text-muted hover:border-primary hover:text-primary transition-colors"
          >
            + Add another question
          </button>

          {/* Settings */}
          <div className="bg-surface rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-3">Poll Duration</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 5, 10, 15].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`px-4 py-2 rounded-xl border-2 transition-all ${
                      duration === mins
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border hover:border-primary/50 text-text-muted'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDuration(null)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    duration === null
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border hover:border-primary/50 text-text-muted'
                  }`}
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
                className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="anonymous" className="text-sm text-text">
                Enable anonymous voting (voter names hidden)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Poll'}
          </button>
        </form>
      </div>
    </div>
  )
}