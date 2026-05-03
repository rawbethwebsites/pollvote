// Poll types
export interface Question {
  id: string
  text: string
  options: string[]
}

export interface Poll {
  id: string
  title: string
  questions: Question[]
  createdAt: string
  endsAt: string | null
  isActive: boolean
  isAnonymous: boolean
  votes: Record<string, Record<string, string[]>> // questionId -> option -> voter names
}

export interface PollLink {
  poll: Poll
  type: 'host' | 'vote' | 'results'
}

// Generate IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function generateQuestionId(): string {
  return Math.random().toString(36).substring(2, 6)
}

// Encode/decode poll to URL-safe base64
export function encodePoll(poll: Poll): string {
  const json = JSON.stringify(poll)
  // Use base64url encoding (URL-safe)
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
}

export function decodePoll(encoded: string): Poll | null {
  try {
    const json = decodeURIComponent(atob(encoded))
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Build URLs
export function buildVoteUrl(baseUrl: string, poll: Poll): string {
  return `${baseUrl}/vote?p=${encodePoll(poll)}`
}

export function buildResultsUrl(baseUrl: string, poll: Poll): string {
  return `${baseUrl}/results?p=${encodePoll(poll)}`
}

export function buildHostUrl(baseUrl: string, poll: Poll): string {
  return `${baseUrl}/host?p=${encodePoll(poll)}`
}

// Create a new poll
export function createPoll(
  title: string,
  questions: { text: string; options: string[] }[],
  isAnonymous: boolean,
  durationMinutes: number | null
): Poll {
  const id = generateId()
  const endsAt = durationMinutes
    ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
    : null

  const pollQuestions: Question[] = questions.map(q => ({
    id: generateQuestionId(),
    text: q.text,
    options: q.options
  }))

  const votes: Record<string, Record<string, string[]>> = {}
  for (const q of pollQuestions) {
    votes[q.id] = Object.fromEntries(q.options.map(opt => [opt, []]))
  }

  return {
    id,
    title,
    questions: pollQuestions,
    createdAt: new Date().toISOString(),
    endsAt,
    isActive: true,
    isAnonymous,
    votes
  }
}

// Vote on a question
export function castVote(poll: Poll, questionId: string, option: string, voterName: string): Poll {
  if (!poll.isActive) return poll
  if (poll.endsAt && new Date(poll.endsAt) <= new Date()) {
    return { ...poll, isActive: false }
  }

  if (!poll.votes[questionId]?.[option]) return poll
  if (poll.votes[questionId][option].includes(voterName)) return poll

  const newVotes = { ...poll.votes }
  newVotes[questionId] = { ...newVotes[questionId] }
  newVotes[questionId][option] = [...newVotes[questionId][option], voterName]

  return { ...poll, votes: newVotes }
}

// Close poll
export function closePoll(poll: Poll): Poll {
  return { ...poll, isActive: false }
}

// Update poll (before votes)
export function updatePoll(poll: Poll, title: string, questions: { text: string; options: string[] }[]): Poll | null {
  const hasVotes = Object.values(poll.votes).some(v => Object.values(v).some(arr => arr.length > 0))
  if (hasVotes) return null

  const newQuestions: Question[] = questions.map(q => ({
    id: generateQuestionId(),
    text: q.text,
    options: q.options
  }))

  const newVotes: Record<string, Record<string, string[]>> = {}
  for (const q of newQuestions) {
    newVotes[q.id] = Object.fromEntries(q.options.map(opt => [opt, []]))
  }

  return {
    ...poll,
    title,
    questions: newQuestions,
    votes: newVotes
  }
}

// Get results summary
export function getResults(poll: Poll) {
  let remainingSeconds: number | null = null
  if (poll.endsAt && poll.isActive) {
    remainingSeconds = Math.max(0, Math.floor((new Date(poll.endsAt).getTime() - Date.now()) / 1000))
  }

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

  const totalVotesAll = questionResults.reduce((sum, q) => sum + q.totalVotes, 0)

  return { poll, questionResults, totalVotes: totalVotesAll, remainingSeconds }
}

// LocalStorage for host's polls
const HOST_POLLS_KEY = 'pollvote_host_polls'

export function getHostPolls(): Poll[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(HOST_POLLS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function saveHostPoll(poll: Poll): void {
  if (typeof window === 'undefined') return
  const polls = getHostPolls().filter(p => p.id !== poll.id)
  polls.unshift(poll) // Most recent first
  localStorage.setItem(HOST_POLLS_KEY, JSON.stringify(polls.slice(0, 50))) // Keep last 50
}

export function deleteHostPoll(pollId: string): void {
  if (typeof window === 'undefined') return
  const polls = getHostPolls().filter(p => p.id !== pollId)
  localStorage.setItem(HOST_POLLS_KEY, JSON.stringify(polls))
}

// Check if poll is expired and close it
export function checkPollExpiry(poll: Poll): Poll {
  if (poll.isActive && poll.endsAt && new Date(poll.endsAt) <= new Date()) {
    return { ...poll, isActive: false }
  }
  return poll
}