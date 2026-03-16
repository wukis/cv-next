# Jonas Petrik CV Site

This repository contains the personal site, recruiter-friendly CV page, and the checked-in PDF export.

Reusable profile content is centralized in `src/lib/profileContent.ts`. Platform-specific outputs, like the public resume builder, should read from that module instead of reaching into `linkedin.json` or `work.json` directly.

## Getting started

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to preview the site.

## Regenerate the CV PDF

Use the dedicated export command:

```bash
npm run cv:pdf
```

What it does:

- Installs the Playwright Chromium browser if it is not already available.
- Builds the site in production mode.
- Starts the built app locally.
- Renders `/cv` in print mode with a fixed light theme.
- Writes the result to `public/jonas-petrik-cv.pdf`.

The PDF export intentionally excludes the ambient background animation, top navigation, footer, back-to-top button, and other elements wrapped in `print:hidden`.

## Notes

- The CV page itself lives at `/cv`.
- The static PDF committed to the repo lives at `public/jonas-petrik-cv.pdf`.

## LinkedIn sync

The LinkedIn sync tooling uses:

- `src/lib/profileContent.ts` as the desired state
- `src/data/linkedin-sync/` for tracked baselines, snapshots, and rollback history
- `public/linkedin-sync/status.json` for the minimal public deploy artifact
- `.generated/linkedin/` for local working outputs

Commands:

```bash
npm run linkedin:import -- /path/to/linkedin-export
npm run linkedin:sync
npm run linkedin:accept
npm run linkedin:restore -- <snapshot-id>
```

### What gets written where

- `src/data/linkedin-sync/imported.json`: latest sanitized imported LinkedIn baseline
- `src/data/linkedin-sync/history/<snapshot-id>.json`: versioned backup snapshot containing baseline, desired state, and diff summary
- `src/data/linkedin-sync/latest.json`: pointer to the newest snapshot
- `src/data/linkedin-sync/applied.json`: pointer to the last snapshot confirmed as manually applied on LinkedIn
- `.generated/linkedin/payload.json`: current desired LinkedIn payload
- `.generated/linkedin/diff.json`: diff between imported baseline and desired payload
- `.generated/linkedin/copy-pack.md`: manual update pack to apply in LinkedIn
- `.generated/linkedin/restore-pack.md`: rollback pack generated from a saved snapshot baseline
- `public/linkedin-sync/status.json`: minimal public status artifact for deployment

### Backup-first workflow

1. Update the desired source content in `src/lib/profileContent.ts` or `src/data/linkedin-sync/overrides.json`.
2. Export your current LinkedIn data from LinkedIn, then import it:

```bash
npm run linkedin:import -- /path/to/linkedin-export
```

3. Create a backup snapshot and generate the sync pack:

```bash
npm run linkedin:sync
```

This is the critical backup step. Every sync run creates a versioned snapshot in `src/data/linkedin-sync/history/` before you apply any manual LinkedIn changes.

4. Review the generated files:

- `.generated/linkedin/copy-pack.md`
- `.generated/linkedin/diff.json`
- `src/data/linkedin-sync/latest.json`

5. Apply the changes manually in LinkedIn using the copy pack.
6. After the LinkedIn profile looks correct, confirm the snapshot as applied:

```bash
npm run linkedin:accept
```

### Recovery workflow

If the LinkedIn update is wrong or incomplete:

1. Find the snapshot id in `src/data/linkedin-sync/latest.json` or in `src/data/linkedin-sync/history/`.
2. Generate a rollback pack from the saved baseline:

```bash
npm run linkedin:restore -- <snapshot-id>
```

3. Use `.generated/linkedin/restore-pack.md` to manually restore the previous LinkedIn content.

### Agent checklist

An agent making LinkedIn sync changes should follow this sequence:

1. Update the desired content sources.
2. Run `npm run linkedin:import -- /path/to/linkedin-export`.
3. Run `npm run linkedin:sync`.
4. Run `npm run lint`.
5. Run `npm run build`.
6. Confirm that the tracked backup files changed as expected:
   - `src/data/linkedin-sync/imported.json`
   - `src/data/linkedin-sync/latest.json`
   - `src/data/linkedin-sync/history/`
   - `public/linkedin-sync/status.json`
7. Do not commit `.generated/linkedin/`.
8. After the user manually updates LinkedIn and verifies the result, run `npm run linkedin:accept`.
9. Re-run `npm run lint` if any tracked files changed afterward.

### Commit and push latest changes

After the snapshot and status files are correct:

```bash
git status
git add README.md package.json package-lock.json yarn.lock \
  src/lib/profileContent.ts src/lib/linkedinSync.ts scripts/linkedin-sync.ts \
  src/data/linkedin-sync public/linkedin-sync .gitignore
git commit -m "Add backup-first LinkedIn sync workflow"
git push
```

If the branch name matters, create or use a branch with the `codex/` prefix before pushing.

### Safety rules

- `linkedin:sync` must not be used without a fresh import baseline.
- Never commit the raw LinkedIn export ZIP or extracted raw export files.
- Only the sanitized files under `src/data/linkedin-sync/` should be tracked.
- Only `public/linkedin-sync/status.json` should be deployed publicly.
- `.generated/linkedin/` is local working output and must stay untracked.
