import fs from 'fs'
import path from 'path'

export interface Poll {
  id: string
  title: string
  options: string[]
  createdAt: string
  isActive: boolean
  isAnonymous: boolean
  votes: Record<string, string[]>
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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function createPoll(title: string, options: string[], isAnonymous: boolean): Poll {
  const polls = readPolls()
  const id = generateId()
  const poll: Poll = {
    id,
    title,
    options,
    createdAt: new Date().toISOString(),
    isActive: true,
    isAnonymous,
    votes: Object.fromEntries(options.map(opt => [opt, []]))
  }
  polls[id] = poll
  writePolls(polls)
  return poll
}

export function getPoll(id: string): Poll | null {
  const polls = readPolls()
  return polls[id] || null
}

export function vote(pollId: string, option: string, voterName: string): boolean {
  const polls = readPolls()
  const poll = polls[pollId]
  if (!poll || !poll.isActive) return false
  if (!poll.options.includes(option)) return false
  if (poll.votes[option].includes(voterName)) return false
  poll.votes[option].push(voterName)
  writePolls(polls)
  return true
}

export function getResults(id: string) {
  const poll = getPoll(id)
  if (!poll) return null
  const totalVotes = Object.values(poll.votes).flat().length
  const results = poll.options.map(opt => ({
    option: opt,
    count: poll.votes[opt].length,
    percentage: totalVotes === 0 ? 0 : Math.round((poll.votes[opt].length / totalVotes) * 100)
  }))
  return { poll, results, totalVotes }
}

export function closePoll(id: string): boolean {
  const polls = readPolls()
  if (!polls[id]) return false
  polls[id].isActive = false
  writePolls(polls)
  return true
}