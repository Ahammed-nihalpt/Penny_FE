# AskPenny — Invoice Copilot (Frontend)

> The web client for **Penny**, an AI invoice copilot for non‑technical small‑business owners.
> Built to feel warm and approachable for a 35+, not‑very‑technical audience — not like a
> developer tool.

This repository is the **React + TypeScript (Vite)** single‑page app. The API and AI service
live in the companion repo **Penny_BE**.

---

## What's here

- **Auth** — branded login/signup, email/password + **Google sign‑in**, silent token refresh.
- **Dashboard** — a "where your money stands" view: outstanding/overdue/paid, an overdue ring,
  trend sparklines, a cash‑flow area chart, spend‑by‑category donut, and top vendors.
- **Invoices** — table with status (paid / overdue / open), inline icon actions, CSV export, and
  **upload‑to‑extract** (Gemini reads the image and pre‑fills the form).
- **Copilot** — chat with Penny in a contained, modern chat UI: session list, grounded
  "what Penny did" step traces under her replies, a live invoice panel that updates as she acts,
  Stop button, inline error + retry, and a model picker.

## Tech stack

- **React 19 + TypeScript**, **Vite**, **pnpm**
- **Mantine** (UI + charts) with a custom warm "Penny" theme (teal + copper, Inter)
- **Zustand** for state, **React Router** (route‑level code splitting), **axios** with a 401
  silent‑refresh interceptor
- **ESLint + Prettier**, **Vitest**

## Getting started

### Prerequisites
- Node.js 20+, `pnpm`
- The backend (**Penny_BE**) running, by default at `http://localhost:3000/api`

### Setup
```bash
pnpm install
cp .env.example .env   # set VITE_API_URL and (optional) VITE_GOOGLE_CLIENT_ID
pnpm run dev           # app on http://localhost:5173
```

### Scripts
```bash
pnpm run dev      # dev server (HMR)
pnpm run build    # type-check + production build
pnpm run lint     # eslint
pnpm test         # vitest
```

## Environment variables

| Var | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL (default `http://localhost:3000/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web client ID (empty disables the Google button) |

`.env` is git‑ignored; only `.env.example` (placeholders) is committed.

## Project structure

```
src/
  auth/         auth store, protected route
  components/   AppLayout (sidebar), Penny coin mark
  features/
    dashboard/  charts + metrics
    invoices/   table, form modal, store, API
    chat/       copilot page, chat store, API
    models/     model picker
  pages/        login / signup (+ shared AuthShell)
  theme.ts      warm teal + copper Mantine theme
```
