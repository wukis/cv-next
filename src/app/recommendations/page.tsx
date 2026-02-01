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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-mono text-neutral-600 dark:text-neutral-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          {recommendations.length} testimonials
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
          <span className="font-mono text-violet-600 dark:text-violet-400">&gt;</span> cat <span className="text-neutral-500 dark:text-neutral-400">testimonials/*.md</span>
        </h1>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400 font-mono">
          <span className="text-neutral-500 dark:text-neutral-400"># </span>
          Recommendations from colleagues throughout my career
        </p>
      </div>

      {/* Testimonials wall */}
      <TestimonialsWall recommendations={recommendations} />
    </Container>
  )
}
