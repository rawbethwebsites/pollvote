import { NextResponse } from 'next/server'
import { closePoll } from '@/lib/polls'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const success = closePoll(params.id)
  if (!success) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}