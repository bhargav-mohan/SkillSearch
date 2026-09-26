# SkillSearch

SkillSearch helps you get the skills an AI coding agent needs to build your software project.

Describe what you're building in plain language. SkillSearch analyzes your project, identifies the technologies and capabilities required, and generates practical `.md` skill files that any AI coding agent can use.

---

## Prerequisites

- Node.js 20+
- npm 8+ (for workspaces support)
- An OpenAI API key (or any OpenAI-compatible provider key)

---

## Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit `packages/backend/.env` and set your API key:

```
OPENAI_API_KEY=sk-...
```

### 3. Start both services

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## Production Deployment

### Option A — Docker Compose (recommended)

```bash
# Build and start both containers
OPENAI_API_KEY=sk-... docker compose up --build
```

- Frontend served at http://localhost:80
- Backend API at http://localhost:3001

### Option B — Deploy frontend and backend to separate domains

Set `VITE_API_URL` to the backend's public URL when building the frontend:

```bash
# Build frontend pointing to your backend
VITE_API_URL=https://api.your-domain.com npm run build --workspace=packages/frontend
```

Set `CORS_ORIGIN` on the backend to your frontend's domain:

```bash
CORS_ORIGIN=https://your-domain.com node packages/backend/src/index.js
```

### Option B — Manual (no Docker)

```bash
# Build frontend
npm run build --workspace=packages/frontend
# Serve packages/frontend/dist with any static host (Vercel, Netlify, nginx, etc.)

# Run backend
NODE_ENV=production OPENAI_API_KEY=sk-... node packages/backend/src/index.js
```

---

## Using a Custom LLM Provider

SkillSearch supports any OpenAI-compatible provider. Expand the **LLM Config** section in the UI:

| Field | Description |
|-------|-------------|
| **API Key** | Overrides the server `.env` key for this session |
| **Base URL** | Any OpenAI-compatible endpoint — e.g. `http://localhost:11434/v1` for Ollama |
| **Model** | Model name (default: `gpt-4o`) |

---

## Environment Variables

### Backend (`packages/backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | No* | — | Server-side API key. *Required unless users supply their own key in the UI. |
| `PORT` | No | `3001` | HTTP port |
| `CORS_ORIGIN` | No | `*` | Allowed frontend origin in production (e.g. `https://your-domain.com`) |
| `NODE_ENV` | No | `development` | Set to `production` in deployed environments |

### Frontend (`packages/frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `""` | Backend base URL for cross-domain deploys (e.g. `https://api.your-domain.com`). Empty = use relative `/api` path via proxy. |

---

## How It Works

1. You describe your project in the text box.
2. SkillSearch streams a request to an LLM with a structured prompt.
3. The LLM returns a JSON array of skill objects — each classified as:
   - **Generated** — a full `.md` skill file written from scratch
   - **Existing** — a name, description, and verified link to a real public resource
4. Skills stream into the UI in real time as the LLM produces them.
5. You preview each skill with syntax-highlighted markdown rendering.
6. Download individual `.md` files or a ZIP of all generated skills (with a README listing existing skills too).

---

## Project Structure

```
packages/
  backend/
    src/
      index.js          # Express server
      routes/generate.js  # POST /api/generate — SSE streaming endpoint
      agent/
        prompt.js       # System + user prompt templates
        llm.js          # OpenAI-compatible streaming LLM client
    Dockerfile
  frontend/
    src/
      App.jsx           # State machine: input → loading → results | error
      api/generate.js   # SSE stream client
      components/
        InputForm.jsx   # Project description form + LLM config
        Results.jsx     # Results layout
        SkillList.jsx   # Skill sidebar with keyboard navigation
        SkillPreview.jsx  # Markdown + syntax-highlighted preview
        DownloadButtons.jsx  # .md + ZIP download
        ErrorBoundary.jsx   # React error boundary
    Dockerfile
docker-compose.yml
```

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| "No API key provided" error | `OPENAI_API_KEY` not set and no key entered in UI | Set key in `packages/backend/.env` or use the LLM Config panel in the UI |
| Spinner never stops | LLM call timed out (90s limit) | Try a shorter description or a faster model |
| "Too many requests" | Rate limit hit (20 requests per 15 min) | Wait a few minutes then try again |
| "Failed to parse skill data" | LLM returned malformed JSON | Try again — this is usually a one-off LLM issue |
| Frontend can't reach backend | Proxy misconfigured or backend not running | Check backend is running on port 3001; check `VITE_API_URL` in production |
| Skills content looks empty | Model returned empty array | Provide a more detailed project description |
