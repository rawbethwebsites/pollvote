import { NextResponse } from 'next/server'
import { getResults } from '@/lib/polls'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const results = getResults(params.id)
  if (!results) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
  }
  return NextResponse.json(results)
}