import { NextResponse } from 'next/server'
import { getPoll, vote } from '@/lib/polls'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const poll = getPoll(params.id)
  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
  }
  return NextResponse.json(poll)
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { questionId, option, voterName } = body

    if (!questionId || !option || !voterName) {
      return NextResponse.json({ error: 'questionId, option, and voterName required' }, { status: 400 })
    }

    const success = vote(params.id, questionId, option, voterName)
    if (!success) {
      return NextResponse.json({ error: 'Vote failed - poll inactive, expired, or already voted' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}