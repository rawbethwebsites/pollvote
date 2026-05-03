import fs from 'fs'
import path from 'path'

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
  currentQuestionIndex: number
  votes: Record<string, Record<string, string[]>>
}

const DATA_DIR = path.join(process.cwd(), 'data')
const POLLS_FILE = path.join(DATA_DIR, 'polls.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readPolls(): Record<string, Poll> {
  ensureDataDir()
  if (!fs.existsSync(POLLS_FILE)) {
    return {}
  }
  const data = fs.readFileSync(POLLS_FILE, 'utf-8')
  return JSON.parse(data)
}

function writePolls(polls: Record<string, Poll>) {
  ensureDataDir()
  fs.writeFileSync(POLLS_FILE, JSON.stringify(polls, null, 2))
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateQuestionId(): string {
  return Math.random().toString(36).substring(2, 6)
}

export interface CreatePollInput {
  title: string
  questions: { text: string; options: string[] }[]
  isAnonymous: boolean
  durationMinutes: number | null
}

export function createPoll(input: CreatePollInput): Poll {
  const polls = readPolls()
  const id = generateId()
  const endsAt = input.durationMinutes
    ? new Date(Date.now() + input.durationMinutes * 60 * 1000).toISOString()
    : null

  const questions: Question[] = input.questions.map(q => ({
    id: generateQuestionId(),
    text: q.text,
    options: q.options
  }))

  const votes: Record<string, Record<string, string[]>> = {}
  for (const q of questions) {
    votes[q.id] = Object.fromEntries(q.options.map(opt => [opt, []]))
  }

  const poll: Poll = {
    id,
    title: input.title,
    questions,
    createdAt: new Date().toISOString(),
    endsAt,
    isActive: true,
    isAnonymous: input.isAnonymous,
    currentQuestionIndex: 0,
    votes
  }
  polls[id] = poll
  writePolls(polls)
  return poll
}

export function getPoll(id: string): Poll | null {
  const polls = readPolls()
  const poll = polls[id]

  if (poll && poll.endsAt && new Date(poll.endsAt) <= new Date()) {
    poll.isActive = false
    writePolls(polls)
  }

  return poll
}

export function updatePoll(id: string, updates: { title?: string; questions?: { text: string; options: string[] }[] }): Poll | null {
  const polls = readPolls()
  const poll = polls[id]

  if (!poll) return null
  if (!poll.isActive) return null // Can't edit active polls

  if (updates.title !== undefined) {
    poll.title = updates.title
  }

  if (updates.questions !== undefined) {
    // Check if any votes exist
    const hasVotes = Object.values(poll.votes).some(v => Object.values(v).some(arr => arr.length > 0))
    if (hasVotes) return null // Can't change questions if votes exist

    // Rebuild questions and votes
    poll.questions = updates.questions.map(q => ({
      id: generateQuestionId(),
      text: q.text,
      options: q.options
    }))

    poll.votes = {}
    for (const q of poll.questions) {
      poll.votes[q.id] = Object.fromEntries(q.options.map(opt => [opt, []]))
    }
  }

  writePolls(polls)
  return poll
}

export function vote(pollId: string, questionId: string, option: string, voterName: string): boolean {
  const polls = readPolls()
  const poll = polls[pollId]

  if (!poll || !poll.isActive) return false

  if (poll.endsAt && new Date(poll.endsAt) <= new Date()) {
    poll.isActive = false
    writePolls(polls)
    return false
  }

  if (!poll.votes[questionId]) return false
  if (!poll.votes[questionId][option]) return false
  if (poll.votes[questionId][option].includes(voterName)) return false

  poll.votes[questionId][option].push(voterName)
  writePolls(polls)
  return true
}

export function getResults(id: string) {
  const poll = getPoll(id)
  if (!poll) return null

  const totalVotesPerQuestion: Record<string, number> = {}
  const questionResults = poll.questions.map(q => {
    const totalVotes = Object.values(poll.votes[q.id]).flat().length
    totalVotesPerQuestion[q.id] = totalVotes
    return {
      questionId: q.id,
      questionText: q.text,
      results: q.options.map(opt => ({
        option: opt,
        count: poll.votes[q.id][opt].length,
        percentage: totalVotes === 0 ? 0 : Math.round((poll.votes[q.id][opt].length / totalVotes) * 100)
      })),
      totalVotes
    }
  })

  let remainingSeconds = null
  if (poll.endsAt && poll.isActive) {
    remainingSeconds = Math.max(0, Math.floor((new Date(poll.endsAt).getTime() - Date.now()) / 1000))
  }

  return {
    poll,
    questionResults,
    totalVotesPerQuestion,
    remainingSeconds,
    currentQuestionIndex: poll.currentQuestionIndex
  }
}

export function closePoll(id: string): boolean {
  const polls = readPolls()
  if (!polls[id]) return false
  polls[id].isActive = false
  writePolls(polls)
  return true
}