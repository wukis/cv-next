import Link from 'next/link'

import { Container } from '@/components/Container'

const variants = [
  {
    id: 1,
    name: 'Magazine',
    description:
      'CSS Grid bento with named areas — editorial layout innovation',
  },
  {
    id: 2,
    name: 'Editorial',
    description: 'Typography-driven, zero cards — beautiful reading experience',
  },
  {
    id: 3,
    name: 'Narrative',
    description:
      'Stories paired with recommendations — sticky sidebar with identity',
  },
  {
    id: 4,
    name: 'Reveal',
    description: 'Progressive disclosure — tabs, expandables, detail on demand',
  },
  {
    id: 5,
    name: 'Dashboard',
    description: 'Dense flat grid — gap-as-border, 12-column system',
  },
]

export default function TestIndex() {
  return (
    <Container className="mt-16">
      <h1 className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        Homepage Variants
      </h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        5 distinct design directions. Mix and match to build the final design.
      </p>
      <nav className="mt-8 space-y-4">
        {variants.map((v) => (
          <Link
            key={v.id}
            href={`/test/${v.id}`}
            className="block rounded-sm border border-neutral-200 p-4 transition-colors hover:border-emerald-400 dark:border-neutral-800 dark:hover:border-emerald-600"
          >
            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
              /test/{v.id}
            </span>
            <span className="ml-3 font-mono text-sm text-neutral-500">
              {v.name}
            </span>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {v.description}
            </p>
          </Link>
        ))}
      </nav>
    </Container>
  )
}
