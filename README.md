# ORBIT AI

ORBIT AI is an AI workspace designed to turn user intent into reviewable plans and accountable workflows.

## Product principles

- Plan before execution.
- Require approval before external or consequential actions.
- Record evidence for each workflow run.
- Make incomplete work and recovery status visible.
- Keep model and tool integrations replaceable.

## Current status

The first web workspace shell is in place. The current UI runs in local demo mode. Supabase project and initial database schema are provisioned separately; authentication, persisted workspace data, and the verified workflow engine are not yet wired into this interface.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Future orchestration service: Python + FastAPI + LangGraph

## Local development

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
4. Run `npm run dev`.

## Security

Never put Supabase service-role or secret keys in browser code or any `NEXT_PUBLIC_*` variable. Use the publishable key in the client and keep privileged operations on a trusted server.
