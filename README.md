# Jonas Petrik CV Site

This repository contains the personal site, recruiter-friendly CV page, and the checked-in PDF export.

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
