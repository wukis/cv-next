# Stack And Workflows

## Project Shape

This repo is a personal CV and portfolio site built with Next.js App Router, React 19, TypeScript, Tailwind CSS, Sentry, Netlify, and Playwright.

## How the repo is organized

- [`src/app`](../src/app) contains routes, layouts, metadata files, and route handlers.
- [`src/components`](../src/components) contains reusable UI and interactive pieces.
- [`src/lib`](../src/lib) contains shared content, data shaping, and helper logic.
- [`src/data`](../src/data) contains structured source data and LinkedIn sync state.
- [`scripts`](../scripts) contains Node-based maintenance workflows such as PDF generation and LinkedIn sync.

The key content entrypoint is [`src/lib/profileContent.ts`](../src/lib/profileContent.ts). When you want to change public profile content, start there first.

## App Conventions

App Router files are Server Components by default. Add `'use client'` only when a component needs:

- React hooks like `useEffect` or `useState`
- browser APIs like `window` or `document`
- direct event handling or UI state on the client

- Use `next/link` for internal navigation between pages.
- Use `next/image` for local and optimized images.
- Use route metadata in `src/app/*` for titles, descriptions, Open Graph tags, and related SEO fields.
- Use route handlers like [`src/app/resume.json/route.ts`](../src/app/resume.json/route.ts) when the app needs a structured response instead of a page.
- Use the typed image registry in [`src/lib/imageAssets.ts`](../src/lib/imageAssets.ts) instead of dynamic image requires.
- Prefer shared content modules and helpers over hardcoded copy deep inside components.

## Workflows

### Local development

```bash
npm install
npm run dev
```

### Quality checks

Full gate:

```bash
npm run quality
```

This runs format, lint, regular and strict typecheck, tests, Knip, Fallow, and build.

GitHub Actions runs the same checks in separate steps. `next-env.d.ts` may reference generated `.next` route types before build; Fallow is configured to ignore that generated import.

### PDF export

The CV PDF is generated with Playwright:

```bash
npm run cv:pdf
```

This builds the app, starts it locally, renders `/cv`, and writes the PDF to `public/jonas-petrik-cv.pdf`.

The pre-commit hook refreshes the PDF automatically when staged portfolio content changes require it.

### Deployment

Netlify build configuration lives in [`netlify.toml`](../netlify.toml):

- `npm run build`
- publish directory `.next`
- Node 26 and npm 12.0.2
- Cloudinary image plugin pointed at the built static media path
- Netlify Lighthouse configured from the repo

Sentry is configured in [`next.config.mjs`](../next.config.mjs). Production browser source maps are generated so Sentry can upload them, then hidden/deleted from published client output.

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

## Working Effectively

- Start from route files in `src/app/` when you want to understand what page renders where.
- Move into `src/components/` to understand the UI tree.
- Check `src/lib/` to find the actual content source or transformation logic before editing.
- If a change touches copy, resume data, recommendations, or SEO, look for a shared source module before editing JSX.
- Run `npm run quality` before wrapping up substantial changes.
