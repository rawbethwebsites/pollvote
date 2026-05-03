import { NextResponse } from 'next/server'
import { createPoll } from '@/lib/polls'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, options, isAnonymous, durationMinutes } = body
    if (!title || !options || options.length < 2) {
      return NextResponse.json({ error: 'Title and at least 2 options required' }, { status: 400 })
    }
    const poll = createPoll(title, options, isAnonymous || false, durationMinutes || null)
    return NextResponse.json(poll, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}