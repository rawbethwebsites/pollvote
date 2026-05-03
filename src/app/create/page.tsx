'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePoll() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [duration, setDuration] = useState<number | null>(5)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || options.filter(o => o.trim()).length < 2) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          options: options.filter(o => o.trim()),
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
      <div className="max-w-xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="mb-8 text-text-muted hover:text-text flex items-center gap-2"
        >
          <span>←</span> Back
        </button>

        <h1 className="text-3xl font-bold text-text mb-8">Create a Poll</h1>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl shadow-lg p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Question</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you asking?"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Options</label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="px-3 text-text-muted hover:text-error"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-3 text-sm text-primary hover:text-primary-hover"
              >
                + Add another option
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Poll Duration</label>
            <div className="flex gap-3">
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