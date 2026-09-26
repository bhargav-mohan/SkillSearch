# SkillSearch — Full System Plan

## Overview

Build SkillSearch from scratch: a tool where a user describes their software project in plain language and receives a set of AI-generated skill files (.md) that an AI coding agent can use to build it.

The system has two packages in a monorepo:
- `packages/backend` — Node.js + Express API that accepts a project description, calls an LLM, and returns structured skill data
- `packages/frontend` — React + Vite SPA that presents the input form, displays results, and enables file downloads

**Core constraints:**
- Stateless: no server-side storage; skills are generated on demand
- Provider-agnostic: OpenAI is the default LLM provider; any provider key/base URL can be supplied at runtime
- Single LLM call: one request returns all skills as structured JSON
- Skills are delivered as individual downloadable .md files and as a ZIP of all skills

---

## Sub-Task 1 — Monorepo Scaffold

**Intent**
Set up the top-level monorepo structure with npm workspaces so both packages share a root and can be run independently.

**Expected Outcomes**
- Root `package.json` with `workspaces: ["packages/*"]`
- `packages/backend/` and `packages/frontend/` directories exist with their own `package.json` files
- `.gitignore` and root `README.md` present
- `npm install` at root resolves both workspaces

**Todo List**
1. Create root `package.json` with workspaces config and root-level scripts (`dev`, `build`)
2. Create `packages/backend/package.json` with Express, dotenv, cors, archiver, and openai as dependencies
3. Create `packages/frontend/package.json` with React, Vite, and JSZip as dependencies
4. Create root `.gitignore` covering `node_modules`, `dist`, `.env`
5. Create root `README.md` describing the project and how to run it

**Relevant Context**
- No existing code; start from scratch
- npm workspaces (Node 16+) — no need for Lerna or Turborepo

**Status:** [x] done

---

## Sub-Task 2 — Backend: Express Server + LLM Agent

**Intent**
Build the Express backend with a single `POST /api/generate` endpoint. The endpoint accepts a project description and optional LLM config, makes one LLM call with a carefully crafted prompt, and returns an array of skill objects.

**Expected Outcomes**
- `POST /api/generate` accepts `{ description, apiKey?, provider?, model? }` in the request body
- LLM is called with a system prompt that instructs it to: analyze the project, identify required skills, and return them as a JSON array of `{ name, filename, content }` objects where `content` is full .md text
- Response is `{ skills: [{ name, filename, content }] }`
- API key falls back to `OPENAI_API_KEY` from `.env` if not provided in the request
- CORS is enabled so the frontend dev server can reach it
- `GET /health` returns `{ status: "ok" }`

**Todo List**
1. Create `packages/backend/src/index.js` — Express server setup, CORS, JSON body parsing, route mounting
2. Create `packages/backend/src/routes/generate.js` — route handler for `POST /api/generate`
3. Create `packages/backend/src/agent/prompt.js` — the system and user prompt templates for the LLM
4. Create `packages/backend/src/agent/llm.js` — LLM client abstraction (defaults to OpenAI; accepts custom baseURL and model)
5. Create `packages/backend/.env.example` documenting `OPENAI_API_KEY`, `PORT`
6. Add `start` and `dev` scripts to `packages/backend/package.json`

**Relevant Context**
- The prompt in `prompt.js` is the core of the agent. It must instruct the LLM to return a valid JSON array (not markdown fences) with fields: `name` (human-readable skill name), `filename` (e.g. `react-hooks.md`), `content` (full .md skill file content)
- The LLM abstraction in `llm.js` should use the OpenAI SDK's `baseURL` option to support other providers (e.g. Anthropic-compatible, local Ollama)
- Parse and validate the LLM JSON response before returning to the frontend; return a 500 with a clear message if parsing fails

**Status:** [x] done

---

## Sub-Task 3 — Frontend: React + Vite UI

**Intent**
Build the React frontend with two views: an input screen where the user describes their project, and a results screen that displays the generated skills with preview and download options.

**Expected Outcomes**
- Input screen: textarea for project description, optional expandable "LLM Config" section (API key, provider/base URL, model), and a "Generate Skills" submit button
- Loading state: spinner with a message while the backend processes the request
- Results screen: list of skill cards on the left, selected skill markdown preview on the right
- Each skill card has an individual "Download .md" button
- A "Download All as ZIP" button at the top of the results screen
- Error state: clear error message if the backend returns an error
- A "Start Over" button to reset to the input screen
- All results held in React state (no persistence)

**Todo List**
1. Scaffold `packages/frontend` with Vite + React template (`npm create vite`)
2. Create `src/App.jsx` — top-level state machine managing view transitions: `input` → `loading` → `results` | `error`
3. Create `src/components/InputForm.jsx` — project description textarea, LLM config section, submit handler calling `POST /api/generate`
4. Create `src/components/SkillList.jsx` — list of skill cards with selection state
5. Create `src/components/SkillPreview.jsx` — renders the selected skill's markdown content (use a simple `<pre>` block or a lightweight markdown renderer)
6. Create `src/components/DownloadButtons.jsx` — individual .md download and ZIP download using JSZip
7. Create `src/api/generate.js` — thin API client that POSTs to the backend and returns skill data
8. Add a `vite.config.js` proxy so `/api` requests in dev are forwarded to `localhost:3001`
9. Add basic CSS for a clean, functional layout (not a design showcase — legible and usable)

**Relevant Context**
- JSZip (already in dependencies from Sub-Task 1) handles ZIP generation entirely in the browser — no backend ZIP endpoint needed
- The markdown preview does not need a full renderer; a styled `<pre>` tag is sufficient to keep the frontend simple
- The Vite proxy (`server.proxy`) avoids CORS issues during development

**Status:** [x] done

---

## Sub-Task 4 — Integration + Smoke Test

**Intent**
Wire the two packages together, verify the end-to-end flow works, and add the final developer documentation.

**Expected Outcomes**
- Running `npm run dev` at the root starts both backend and frontend concurrently
- A real project description submitted through the UI returns generated skill files
- Individual .md download and ZIP download both work in the browser
- `README.md` documents how to set up and run the project

**Todo List**
1. Install `concurrently` at the root and add a root `dev` script that runs both packages in parallel
2. Verify the Vite proxy correctly forwards `/api` to the backend
3. Test end-to-end with a sample project description (e.g. "A REST API for a todo app using Node and PostgreSQL")
4. Update root `README.md` with: prerequisites, environment variable setup, `npm install`, `npm run dev`, and how to set a custom LLM provider

**Relevant Context**
- Backend default port: `3001`; Frontend default Vite port: `5173`
- The Vite proxy target must match the backend port

**Status:** [x] done
