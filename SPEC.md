# PollVote — Online Voting System

## Concept & Vision

A real-time polling platform inspired by Zoom's polling feature. Host creates a poll, shares a link, voters join and cast their votes while results update live. Clean, confident, professional — like a well-designed productivity tool. No fluff, no friction.

## Design Language

- **Aesthetic:** Clean productivity tool — crisp whites, subtle shadows, confident typography
- **Colors:**
  - Background: `#f8f9fb`
  - Surface: `#ffffff`
  - Primary: `#4f46e5` (indigo)
  - Primary hover: `#4338ca`
  - Text: `#1e293b`
  - Text muted: `#64748b`
  - Border: `#e2e8f0`
  - Success: `#10b981`
  - Error: `#ef4444`
- **Typography:** Inter (sans-serif), monospace for codes
- **Spacing:** 4px base unit, generous whitespace
- **Motion:** Subtle fade-ins, button press feedback, smooth transitions

## Layout & Structure

1. **Landing page** — Hero with "Create Poll" CTA, secondary "Join Poll" link
2. **Host dashboard** — Create/edit polls, see live results, share link
3. **Voter join page** — Enter name, join poll
4. **Voting page** — Cast vote, submit
5. **Results page** — Live results with bar charts

## Features & Interactions

### Poll Creation (Host)
- Create poll with title and options (2-10 options)
- Get shareable poll ID/link
- Launch/close voting
- View real-time results as voters cast votes
- Anonymous or identified voting mode

### Voter Flow
- Enter display name
- Join via poll ID or link
- See active poll and cast vote
- See confirmation after voting

### Real-time Results
- Bar chart visualization for each option
- Vote count and percentage
- Auto-update as votes come in (5s polling)

## Technical Approach

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State:** React hooks + API routes
- **Data:** File-based JSON storage (for demo portability)
- **Real-time:** Client-side polling every 5 seconds

### Data Model

```typescript
interface Poll {
  id: string
  title: string
  options: string[]
  createdAt: string
  isActive: boolean
  isAnonymous: boolean
  votes: Record<string, string[]> // option -> voter names
}

interface Voter {
  name: string
  pollId: string
  hasVoted: boolean
}
```

### API Endpoints

- `POST /api/polls` — Create poll
- `GET /api/polls/[id]` — Get poll details
- `POST /api/polls/[id]/vote` — Cast vote
- `GET /api/polls/[id]/results` — Get results

## Components

1. **Button** — Primary, secondary, ghost variants
2. **Input** — Text input with label
3. **Card** — Poll card with shadow
4. **BarChart** — Vote result bars with animation
5. **Badge** — Poll status (active/closed)