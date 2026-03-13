import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { TestimonialsWall } from '@/components/TestimonialsWall'
import recommendations from '@/data/recommendations.json'

export const metadata: Metadata = {
  title: 'Recommendations',
  description:
    'Professional recommendations and testimonials for Jonas Petrik from colleagues and industry peers.',
  alternates: {
    canonical: '/recommendations',
  },
}

export default async function RecommendationsPage() {
  return (
    <Container className="mt-10 sm:mt-16">
      {/* Page header */}
      <div className="mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1.5 font-mono text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
          <span className="h-2 w-2 rounded-full bg-violet-500" />
          {recommendations.length} testimonials
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl lg:text-5xl dark:text-neutral-100">
          <span className="font-mono text-violet-600 dark:text-violet-400">
            &gt;
          </span>{' '}
          cat{' '}
          <span className="text-neutral-500 dark:text-neutral-400">
            testimonials/*.md
          </span>
        </h1>
        <p className="mt-3 font-mono text-lg text-neutral-600 dark:text-neutral-400">
          <span className="text-neutral-500 dark:text-neutral-400"># </span>
          Recommendations from colleagues throughout my career
        </p>
      </div>

      {/* Testimonials wall */}
      <TestimonialsWall recommendations={recommendations} />
    </Container>
  )
}
