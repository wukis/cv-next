# AGENTS.md

## Project focus

This repository is a content-heavy personal site built with Next.js App Router, React 19, TypeScript, Tailwind CSS, Sentry, and a Playwright-based PDF export flow.

## Load this extra context when relevant

- For framework, routing, rendering, or maintainer workflow questions, read [`docs/stack-and-workflows.md`](./docs/stack-and-workflows.md) before making structural changes.
- If the task is only a copy/content tweak, you usually do not need the extra doc.

## Source of truth

- Treat [`src/lib/profileContent.ts`](./src/lib/profileContent.ts) as the canonical content source for public profile data.
- Prefer editing shared content modules and derived helpers over reaching directly into raw JSON files.
- Keep `src/data/linkedin-sync/` as tracked sync state, not as the primary editing surface for site copy.

## React and Next.js conventions

- Default to Server Components. Add `'use client'` only when a component needs hooks, browser APIs, DOM events, or client-only state.
- Keep route concerns in `src/app/`, reusable UI in `src/components/`, and shared content or helpers in `src/lib/`.
- Use `next/image` for local images and `next/link` for internal navigation.
- Preserve metadata, route handlers, and other App Router file conventions when editing routes.

## Workflow safeguards

- Preserve the CV PDF export flow in `scripts/generate-cv-pdf.mjs`.
- Preserve the LinkedIn sync flow in `scripts/linkedin-sync.ts`.
- Do not commit `.generated/`.
- Keep build-time behavior in `next.config.mjs` and `scripts/obfuscate.mjs` intact unless the task explicitly targets them.

## Quality baseline

- Run `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run build` before finishing substantial changes.
- `npm run typecheck:strict` and `npm run knip` are advisory for now and should inform cleanup work, not block routine edits unless the task asks for it.
- Use `npm`, not Yarn, for all package management in this repo.

## Agent context notes

- The app is intentionally content-first: many edits are data and presentation changes rather than framework-heavy feature work.
- Dynamic image `require(...)` callsites exist today; do not refactor them opportunistically unless the task is about asset loading or component cleanup.
- `src/app/global-error.jsx` is legacy JavaScript and can stay that way unless there is a reason to modernize it.

## Future Next.js docs integration

- If this project is upgraded to a Next.js version that ships local AI-doc bundles for existing projects, extend this file to point agents at `node_modules/next/dist/docs/` before making framework-specific changes.
