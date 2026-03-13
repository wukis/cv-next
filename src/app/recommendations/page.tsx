import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { TerminalPageHeader } from '@/components/TerminalHeader'
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
      <TerminalPageHeader
        eyebrow={`${recommendations.length} testimonials`}
        command="cat"
        argument="testimonials.md"
        description="Recommendations from colleagues throughout my career"
      />

      {/* Testimonials wall */}
      <TestimonialsWall recommendations={recommendations} />
    </Container>
  )
}
