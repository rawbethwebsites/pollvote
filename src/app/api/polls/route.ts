import { NextResponse } from 'next/server'
import { createPoll } from '@/lib/polls'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, questions, isAnonymous, durationMinutes } = body

    if (!title || !questions || questions.length < 1) {
      return NextResponse.json({ error: 'Title and at least 1 question required' }, { status: 400 })
    }

    for (const q of questions) {
      if (!q.text || !q.options || q.options.length < 2) {
        return NextResponse.json({ error: 'Each question needs text and at least 2 options' }, { status: 400 })
      }
    }

    const poll = createPoll({ title, questions, isAnonymous: isAnonymous || false, durationMinutes: durationMinutes || null })
    return NextResponse.json(poll, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}