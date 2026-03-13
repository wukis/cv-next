import { type Metadata } from 'next'
import { Container } from '@/components/Container'
import recommendations from '@/data/recommendations.json'
import work from '@/data/work.json'

export const metadata: Metadata = {
  title: 'Design Tests',
  description: 'Developer aesthetic design alternatives showcase',
  robots: 'noindex, nofollow',
}

// File icons for editor tabs
function MarkdownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1ZM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2Z" />
      <path d="M9.146 7.146a.5.5 0 0 1 .708 0L11.5 8.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708ZM3.5 6v4h1V7.5L5.5 9l1-1.5V10h1V6h-1l-1 1.5L4.5 6h-1Z" />
    </svg>
  )
}

function TypeScriptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2Zm9 1.5v1h2v7h1.5v-7H15v-1H9ZM5.5 8.5v4H7v-4h1.5v-1H4v1h1.5Z" />
    </svg>
  )
}

function JsonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.708 5.578L2.061 8.224l2.647 2.646-.708.708-3-3a.5.5 0 0 1 0-.708l3-3 .708.708Zm6.584 0l2.647 2.646-2.647 2.646.708.708 3-3a.5.5 0 0 0 0-.708l-3-3-.708.708ZM7.854 13.354l2-8-.708-.708-2 8 .708.708Z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708Z" />
    </svg>
  )
}

// Section wrapper component
function DemoSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-16">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-bold text-neutral-800 dark:text-neutral-100">
          {title}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

// =============================================================================
// STYLE 1: Code Editor Tabs
// =============================================================================

function EditorTabsDemo() {
  const firstRec = recommendations[0]

  return (
    <DemoSection
      title="1. Code Editor Tabs"
      description="VS Code-style tabbed interface with file icons, active states, and unsaved indicators."
    >
      {/* Example 1: Profile panel with tabs */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        {/* Tab bar */}
        <div className="flex border-b border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
          {/* Active tab */}
          <div className="flex items-center gap-2 border-r border-neutral-200 bg-white px-4 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
            <MarkdownIcon className="h-4 w-4 text-sky-500" />
            <span className="text-sm">profile.md</span>
            <span
              className="h-2 w-2 rounded-full bg-sky-500"
              title="Modified"
            />
            <button className="rounded p-0.5 opacity-0 hover:bg-neutral-200 group-hover:opacity-100 dark:hover:bg-neutral-700">
              <CloseIcon className="h-3 w-3" />
            </button>
          </div>
          {/* Inactive tabs */}
          <div className="flex cursor-pointer items-center gap-2 px-4 py-2 text-neutral-500 hover:bg-neutral-200/50 dark:text-neutral-400 dark:hover:bg-neutral-700/50">
            <TypeScriptIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm">experience.tsx</span>
            <button className="rounded p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-600">
              <CloseIcon className="h-3 w-3" />
            </button>
          </div>
          <div className="flex cursor-pointer items-center gap-2 px-4 py-2 text-neutral-500 hover:bg-neutral-200/50 dark:text-neutral-400 dark:hover:bg-neutral-700/50">
            <JsonIcon className="h-4 w-4 text-amber-500" />
            <span className="text-sm">skills.json</span>
            <button className="rounded p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-600">
              <CloseIcon className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            Jonas Petrik
          </h3>
          <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Staff Engineer / Team Lead at SCAYLE
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Leading checkout team handling ~550 orders/minute on peak. Zero
            downtime Black Friday 2025.
          </p>
        </div>
      </div>

      {/* Example 2: Recommendation card with tabs */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex border-b border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2 border-r border-neutral-200 bg-white px-4 py-2 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
            <MarkdownIcon className="h-4 w-4 text-sky-500" />
            <span className="text-sm">recommendations/{firstRec.slug}.md</span>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 font-semibold text-white">
              {firstRec.fullName.charAt(0)}
            </div>
            <div>
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">
                {firstRec.fullName}
              </h4>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {firstRec.position}
              </p>
            </div>
          </div>
          <p className="line-clamp-3 text-sm text-neutral-600 dark:text-neutral-300">
            {firstRec.body.substring(0, 300)}...
          </p>
        </div>
      </div>
    </DemoSection>
  )
}

// =============================================================================
// STYLE 2: Syntax-Highlighted Headers
// =============================================================================

function SyntaxHighlightDemo() {
  return (
    <DemoSection
      title="2. Syntax-Highlighted Headers"
      description="Decorative code snippets as section headers using Tailwind for syntax coloring."
    >
      {/* Example 1: Profile as const declaration */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900 dark:border-neutral-700">
        {/* Code header */}
        <div className="border-b border-neutral-700 px-4 py-3 font-mono text-sm">
          <span className="text-pink-400">const</span>{' '}
          <span className="text-blue-300">profile</span>{' '}
          <span className="text-neutral-400">=</span>{' '}
          <span className="text-amber-300">{'{'}</span>{' '}
          <span className="text-emerald-300">name</span>
          <span className="text-neutral-400">:</span>{' '}
          <span className="text-amber-200">&quot;Petrik&quot;</span>
          <span className="text-neutral-400">,</span>{' '}
          <span className="text-emerald-300">status</span>
          <span className="text-neutral-400">:</span>{' '}
          <span className="text-amber-200">&quot;available&quot;</span>{' '}
          <span className="text-amber-300">{'}'}</span>
        </div>
        {/* Content in light mode style */}
        <div className="bg-white p-6 dark:bg-neutral-800">
          <p className="text-neutral-600 dark:text-neutral-300">
            Staff Engineer leading checkout at SCAYLE. Zero downtime Black
            Friday 2025 handling ~550 orders/minute.
          </p>
        </div>
      </div>

      {/* Example 2: Function signature for recommendations */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900 dark:border-neutral-700">
        <div className="border-b border-neutral-700 px-4 py-3 font-mono text-sm">
          <span className="text-pink-400">function</span>{' '}
          <span className="text-blue-300">Recommendation</span>
          <span className="text-neutral-400">(</span>
          <span className="text-amber-300">{'{'}</span>{' '}
          <span className="text-orange-300">author</span>
          <span className="text-neutral-400">,</span>{' '}
          <span className="text-orange-300">role</span>{' '}
          <span className="text-amber-300">{'}'}</span>
          <span className="text-neutral-400">)</span>{' '}
          <span className="text-amber-300">{'{'}</span>{' '}
          <span className="text-neutral-500">...</span>{' '}
          <span className="text-amber-300">{'}'}</span>
        </div>
        <div className="bg-white p-6 dark:bg-neutral-800">
          <p className="italic text-neutral-600 dark:text-neutral-300">
            &quot;Jonas is not only somebody nice to work with - he&apos;s also
            somebody who can bring in new aspects and implement them.&quot;
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            — Martin Will, CTO at anwalt.de
          </p>
        </div>
      </div>

      {/* Example 3: Interface for experience */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900 dark:border-neutral-700">
        <div className="border-b border-neutral-700 px-4 py-3 font-mono text-sm">
          <span className="text-pink-400">export</span>{' '}
          <span className="text-pink-400">interface</span>{' '}
          <span className="text-emerald-300">Experience</span>{' '}
          <span className="text-amber-300">{'{'}</span>{' '}
          <span className="text-blue-300">company</span>
          <span className="text-neutral-400">:</span>{' '}
          <span className="text-emerald-400">string</span>
          <span className="text-neutral-400">;</span>{' '}
          <span className="text-blue-300">role</span>
          <span className="text-neutral-400">:</span>{' '}
          <span className="text-emerald-400">string</span>
          <span className="text-neutral-400">;</span>{' '}
          <span className="text-amber-300">{'}'}</span>
        </div>
        <div className="bg-white p-6 dark:bg-neutral-800">
          <div className="mb-2 flex items-center gap-3">
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">
              {work[0].name}
            </span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-600 dark:text-neutral-400">
              {work[0].position}
            </span>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {work[0].location}
          </p>
        </div>
      </div>
    </DemoSection>
  )
}

// =============================================================================
// STYLE 3: GitHub/npm Badges
// =============================================================================

function Badge({
  label,
  value,
  color = 'neutral',
}: {
  label: string
  value: string
  color?: 'neutral' | 'emerald' | 'sky' | 'violet' | 'amber' | 'rose'
}) {
  const colorClasses = {
    neutral: 'bg-neutral-600',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }

  return (
    <div className="inline-flex text-xs font-medium">
      <span className="rounded-l bg-neutral-700 px-2 py-0.5 text-neutral-100">
        {label}
      </span>
      <span
        className={`rounded-r px-2 py-0.5 text-white ${colorClasses[color]}`}
      >
        {value}
      </span>
    </div>
  )
}

function SimpleBadge({
  children,
  color = 'neutral',
}: {
  children: React.ReactNode
  color?: 'neutral' | 'emerald' | 'sky' | 'violet' | 'amber'
}) {
  const colorClasses = {
    neutral: 'bg-neutral-700 text-neutral-100',
    emerald: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    sky: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  }

  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  )
}

function BadgesDemo() {
  return (
    <DemoSection
      title="3. GitHub/npm Badges"
      description="Shield.io-style badges with label-value pairs and color variants."
    >
      {/* Example 1: Profile header with badges */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex flex-wrap gap-2">
            <Badge label="version" value="2.0.0" color="emerald" />
            <Badge label="lang" value="TypeScript" color="sky" />
            <Badge label="status" value="Available" color="emerald" />
            <Badge label="experience" value="12+ years" color="violet" />
            <Badge label="location" value="Germany" color="neutral" />
          </div>
        </div>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            Jonas Petrik
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Staff Engineer / Team Lead at SCAYLE. Building high-throughput
            checkout systems for 100+ brands.
          </p>
        </div>
      </div>

      {/* Example 2: Tech stack badges */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex flex-wrap gap-2">
            <SimpleBadge color="sky">PHP</SimpleBadge>
            <SimpleBadge color="amber">Go</SimpleBadge>
            <SimpleBadge color="violet">TypeScript</SimpleBadge>
            <SimpleBadge color="emerald">Laravel</SimpleBadge>
            <SimpleBadge color="sky">React</SimpleBadge>
            <SimpleBadge color="neutral">Kubernetes</SimpleBadge>
            <SimpleBadge color="amber">AWS</SimpleBadge>
          </div>
        </div>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            Tech Stack
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Full-stack development with focus on backend systems, API design,
            and cloud infrastructure.
          </p>
        </div>
      </div>

      {/* Example 3: Testimonial with credential badges */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex flex-wrap items-center gap-2">
            <Badge label="from" value="Daniel Motzev" color="neutral" />
            <Badge label="role" value="Lead DevOps" color="sky" />
            <Badge label="company" value="anwalt.de" color="violet" />
            <Badge label="date" value="Feb 2024" color="neutral" />
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm italic text-neutral-600 dark:text-neutral-300">
            &quot;Jonas very quickly stood out from the rest of my new
            colleagues as a strongly goal oriented,
            let&apos;s-cut-through-the-nonsense professional.&quot;
          </p>
        </div>
      </div>
    </DemoSection>
  )
}

// =============================================================================
// STYLE 4: Line Numbers + Gutters
// =============================================================================

function LineNumbersDemo() {
  const profileLines = [
    '# Jonas Petrik',
    '',
    '## Staff Engineer / Team Lead',
    '',
    'Leading checkout at SCAYLE - the platform',
    'behind Harrods, Deichmann, and 100+ brands.',
    '',
    '## Highlights',
    '',
    '- Zero downtime Black Friday 2025',
    '- ~550 orders/minute at peak',
    '- Promoted for quality focus',
  ]

  const codeLines = [
    'const developer = {',
    '  name: "Jonas Petrik",',
    '  role: "Staff Engineer",',
    '  location: "Germany",',
    '  skills: [',
    '    "PHP", "Go", "TypeScript",',
    '    "Laravel", "React", "K8s"',
    '  ],',
    '  available: true',
    '};',
  ]

  return (
    <DemoSection
      title="4. Line Numbers + Gutters"
      description="IDE-style gutter with line numbers, optional breakpoints, and monospace alignment."
    >
      {/* Example 1: Markdown-style content with line numbers */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex">
          {/* Gutter */}
          <div className="select-none border-r border-neutral-200 bg-neutral-100 px-2 py-4 dark:border-neutral-700 dark:bg-neutral-800">
            {profileLines.map((_, i) => (
              <div
                key={i}
                className="pr-2 text-right font-mono text-xs leading-6 text-neutral-400 dark:text-neutral-500"
              >
                {i + 1}
              </div>
            ))}
          </div>
          {/* Content */}
          <div className="flex-1 overflow-x-auto px-4 py-4 font-mono text-sm leading-6">
            {profileLines.map((line, i) => (
              <div
                key={i}
                className={
                  line.startsWith('#')
                    ? 'font-bold text-sky-600 dark:text-sky-400'
                    : line.startsWith('##')
                      ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                      : line.startsWith('-')
                        ? 'text-neutral-600 dark:text-neutral-300'
                        : 'text-neutral-600 dark:text-neutral-300'
                }
              >
                {line || '\u00A0'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Example 2: Code with line numbers and breakpoint */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900 dark:border-neutral-700">
        <div className="flex">
          {/* Gutter with breakpoint indicator */}
          <div className="flex select-none border-r border-neutral-700 bg-neutral-800 py-4">
            {/* Breakpoint column */}
            <div className="flex w-6 flex-col items-center">
              {codeLines.map((_, i) => (
                <div key={i} className="flex h-6 items-center justify-center">
                  {i === 4 && (
                    <div
                      className="h-3 w-3 rounded-full bg-rose-500"
                      title="Breakpoint"
                    />
                  )}
                </div>
              ))}
            </div>
            {/* Line numbers */}
            <div className="pr-3">
              {codeLines.map((_, i) => (
                <div
                  key={i}
                  className={`text-right font-mono text-xs leading-6 ${
                    i === 4 ? 'text-rose-400' : 'text-neutral-500'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
          {/* Code content */}
          <div className="flex-1 overflow-x-auto px-4 py-4 font-mono text-sm leading-6">
            {codeLines.map((line, i) => (
              <div
                key={i}
                className={i === 4 ? '-mx-4 bg-rose-500/10 px-4' : ''}
              >
                <SyntaxLine code={line} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Example 3: Collapsible fold markers */}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-900 dark:border-neutral-700">
        <div className="flex">
          <div className="flex select-none border-r border-neutral-700 bg-neutral-800 py-4">
            {/* Fold markers */}
            <div className="flex w-6 flex-col items-center">
              <div className="flex h-6 cursor-pointer items-center justify-center text-xs text-neutral-500 hover:text-neutral-300">
                ▼
              </div>
              <div className="h-6" />
              <div className="flex h-6 cursor-pointer items-center justify-center text-xs text-neutral-500 hover:text-neutral-300">
                ▼
              </div>
              <div className="h-6" />
              <div className="h-6" />
              <div className="h-6" />
            </div>
            {/* Line numbers */}
            <div className="pr-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="text-right font-mono text-xs leading-6 text-neutral-500"
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 px-4 py-4 font-mono text-sm leading-6 text-neutral-300">
            <div>
              <span className="text-pink-400">interface</span>{' '}
              <span className="text-emerald-300">Developer</span> {`{`}
            </div>
            <div className="pl-4">
              <span className="text-blue-300">name</span>:{' '}
              <span className="text-emerald-400">string</span>;
            </div>
            <div className="pl-4">
              <span className="text-blue-300">skills</span>: {`{`}
            </div>
            <div className="pl-8">
              <span className="text-blue-300">languages</span>:{' '}
              <span className="text-emerald-400">string</span>[];
            </div>
            <div className="pl-8">
              <span className="text-blue-300">frameworks</span>:{' '}
              <span className="text-emerald-400">string</span>[];
            </div>
            <div className="pl-4">{`};`}</div>
          </div>
        </div>
      </div>
    </DemoSection>
  )
}

// Simple syntax highlighter for the code display
function SyntaxLine({ code }: { code: string }) {
  // Very basic tokenization for demo
  const tokens = code.split(/(\s+|[{}[\],;:="'])/g).filter(Boolean)

  return (
    <span>
      {tokens.map((token, i) => {
        if (
          [
            'const',
            'let',
            'var',
            'function',
            'return',
            'true',
            'false',
          ].includes(token)
        ) {
          return (
            <span key={i} className="text-pink-400">
              {token}
            </span>
          )
        }
        if (token.startsWith('"') || token.startsWith("'")) {
          return (
            <span key={i} className="text-amber-200">
              {token}
            </span>
          )
        }
        if (['{', '}', '[', ']', '(', ')'].includes(token)) {
          return (
            <span key={i} className="text-amber-300">
              {token}
            </span>
          )
        }
        if ([':', ',', ';', '='].includes(token)) {
          return (
            <span key={i} className="text-neutral-400">
              {token}
            </span>
          )
        }
        return (
          <span key={i} className="text-neutral-300">
            {token}
          </span>
        )
      })}
    </span>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default function TestPage() {
  return (
    <Container className="mt-10 sm:mt-16">
      {/* Page header */}
      <div className="mb-12">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl dark:text-neutral-100">
          Design Alternatives
        </h1>
        <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
          Four developer-themed design options to explore as alternatives to the
          current{' '}
          <code className="rounded bg-neutral-200 px-1.5 py-0.5 font-mono text-sm dark:bg-neutral-700">
            ~/path
          </code>{' '}
          style headers. Mix and match elements to find the right aesthetic.
        </p>
      </div>

      {/* All demos */}
      <div className="max-w-4xl">
        <EditorTabsDemo />
        <SyntaxHighlightDemo />
        <BadgesDemo />
        <LineNumbersDemo />
      </div>

      {/* Summary section */}
      <div className="mt-16 max-w-4xl rounded-lg border border-neutral-200 bg-neutral-100 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 font-medium text-neutral-700 dark:text-neutral-200">
              1. Editor Tabs
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Familiar IDE metaphor. Good for multi-view content.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-neutral-700 dark:text-neutral-200">
              2. Syntax Headers
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Code-as-decoration. Strong developer signal.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-neutral-700 dark:text-neutral-200">
              3. Badges
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Quick info at a glance. Works well for metadata.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-neutral-700 dark:text-neutral-200">
              4. Line Numbers
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              IDE authenticity. Best for code-heavy content.
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}
