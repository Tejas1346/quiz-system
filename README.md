# Quiz System

Online quiz platform with real-time multiplayer and leaderboard (in progress).

## Project layout

```
quiz-system/
├── backend/          # Express + Socket.io API
├── client/           # React + Vite (Phase 4)
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 20+
- Docker (for MongoDB and Redis)

## Quick start

1. Start databases:

   ```bash
   docker compose up -d
   ```

2. Configure the backend:

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Install and run the API:

   ```bash
   cd backend && npm install
   npm run dev
   ```

   From the repo root you can also run `npm run dev`.

4. Verify:

   ```bash
   curl http://localhost:5000/api/health
   ```

## Environment variables

See [backend/.env.example](backend/.env.example).

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend origin for CORS (default `http://localhost:3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Signing secret for auth (Phase 1+) |

## Socket events (current)

| Client → server | Payload |
|-----------------|---------|
| `join-room` | `{ quizId, username }` |
| `submit_answer` | `{ quizId, username, isCorrect, timeRemaining }` |

| Server → client | Payload |
|-----------------|---------|
| `update-players` | `string[]` |
| `player_answered` | `{ count }` |

## Roadmap

- Phase 1: JWT auth and User model
- Phase 2: Quiz CRUD API
- Phase 3: Host game flow, server-side grading, leaderboard broadcast
- Phase 4: React client
