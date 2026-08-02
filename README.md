# Jonas Petrik CV Site

Personal site, recruiter-friendly CV page, public resume JSON endpoint, and checked-in PDF export.

The canonical public profile content lives in `src/lib/profileContent.ts`. Pages, structured data, resume JSON, and sync tooling should read from that module or its helpers instead of reaching into raw data files directly.

## Local Development

Use npm with Node 26:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality

Run the full gate before finishing substantial changes:

```bash
npm run quality
```

That covers formatting, linting, both TypeScript lanes, tests, Knip, Fallow, and a production build.

For narrower checks, use the scripts in `package.json`.

## CV PDF

The static PDF lives at `public/jonas-petrik-cv.pdf`. Regenerate it with:

```bash
npm run cv:pdf
```

The command installs Playwright Chromium when needed, builds the app, starts it locally, renders `/cv` in print mode, and writes the PDF.

The pre-commit hook also regenerates and stages the PDF when staged portfolio content changes require it. If related content is unstaged, the hook stops to avoid committing a PDF that does not match the committed source.

## Deployment

Netlify configuration is versioned in `netlify.toml`.

- Build command: `npm run build`
- Publish directory: `.next`
- Runtime pins: Node 26 and npm 12.0.2
- Build plugins: Cloudinary image rewrites and Netlify Lighthouse

Sentry uploads hidden production source maps during `next build`. Browser source maps are generated for upload, then hidden/deleted from the published static output.

## LinkedIn sync

LinkedIn sync is a backup-first manual workflow. It uses:

- `src/lib/profileContent.ts` as the desired state
- `src/data/linkedin-sync/` for tracked sanitized baselines, snapshots, and status
- `.generated/linkedin/` for local working outputs

Commands:

```bash
npm run linkedin:import -- /path/to/linkedin-export
npm run linkedin:sync
npm run linkedin:accept
npm run linkedin:restore -- <snapshot-id>
```

Typical flow:

1. Update the desired source content in `src/lib/profileContent.ts` or `src/data/linkedin-sync/overrides.json`.
2. Export current LinkedIn data and import it with `npm run linkedin:import -- /path/to/linkedin-export`.
3. Run `npm run linkedin:sync` to create a tracked snapshot and a local copy pack.
4. Review `.generated/linkedin/copy-pack.md`, `.generated/linkedin/diff.json`, and `src/data/linkedin-sync/latest.json`.
5. Apply the copy pack manually in LinkedIn.
6. After verifying LinkedIn, run `npm run linkedin:accept`.

For rollback, run:

```bash
npm run linkedin:restore -- <snapshot-id>
```

Do not commit raw LinkedIn exports or `.generated/`; only sanitized sync state under `src/data/linkedin-sync/` belongs in git.

## Contributor Notes

Project guidance for contributors and AI agents lives in `AGENTS.md` and `docs/stack-and-workflows.md`.
