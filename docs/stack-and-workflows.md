# Stack And Workflows

## What this project is

This repo is a personal CV and portfolio site built with Next.js App Router. Next.js provides routing, server rendering, metadata handling, asset optimization, and production builds. React is the component model used inside that framework.

If you are new to React and Next.js, the most useful mental model is:

- React is how the UI is composed from components.
- Next.js is the application framework that decides routing, rendering, data boundaries, metadata, and deployment behavior.

## How the repo is organized

- [`src/app`](../src/app) contains routes, layouts, metadata files, and route handlers.
- [`src/components`](../src/components) contains reusable UI and interactive pieces.
- [`src/lib`](../src/lib) contains shared content, data shaping, and helper logic.
- [`src/data`](../src/data) contains structured source data and LinkedIn sync state.
- [`scripts`](../scripts) contains Node-based maintenance workflows such as PDF generation and LinkedIn sync.

The key content entrypoint is [`src/lib/profileContent.ts`](../src/lib/profileContent.ts). When you want to change public profile content, start there first.

## React and Next.js standards used here

### Server Components first

In App Router, files are Server Components by default. That is a good default because it reduces client-side JavaScript and keeps content rendering simple.

Add `'use client'` only when a component needs:

- React hooks like `useEffect` or `useState`
- browser APIs like `window` or `document`
- direct event handling or UI state on the client

### Next.js primitives

- Use `next/link` for internal navigation between pages.
- Use `next/image` for local and optimized images.
- Use route metadata in `src/app/*` for titles, descriptions, Open Graph tags, and related SEO fields.
- Use route handlers like [`src/app/resume.json/route.ts`](../src/app/resume.json/route.ts) when the app needs a structured response instead of a page.

### Content and presentation

This repo is closer to a structured content site than a typical product app. A lot of changes should happen in shared content modules and helpers, not by hardcoding copy deep inside components.

## Important workflows

### Local development

```bash
npm install
npm run dev
```

### Quality checks

Blocking checks:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run typecheck:strict
npm run knip
npm run build
```

### PDF export

The CV PDF is generated with Playwright:

```bash
npm run cv:pdf
```

This builds the app, starts it locally, renders `/cv`, and writes the PDF to `public/jonas-petrik-cv.pdf`.

### LinkedIn sync

The LinkedIn workflow is maintained through [`scripts/linkedin-sync.ts`](../scripts/linkedin-sync.ts). Treat it as a tracked content-sync process with backup snapshots.

Common commands:

```bash
npm run linkedin:import -- /path/to/linkedin-export
npm run linkedin:sync
npm run linkedin:accept
npm run linkedin:restore -- <snapshot-id>
```

Keep `.generated/linkedin/` untracked.

## Working effectively as a newcomer

- Start from route files in `src/app/` when you want to understand what page renders where.
- Move into `src/components/` to understand the UI tree.
- Check `src/lib/` to find the actual content source or transformation logic before editing.
- If a change touches copy, resume data, recommendations, or SEO, look for a shared source module before editing JSX.
- Run the full quality commands before wrapping up changes so the repo stays agent-friendly and easy to maintain.
