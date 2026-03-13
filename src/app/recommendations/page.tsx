import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { TerminalPageHeader } from '@/components/TerminalHeader'
import { TestimonialsWall } from '@/components/TestimonialsWall'
import recommendations from '@/data/recommendations.json'
import { recommendationsCopy } from '@/lib/recommendationsCopy'

export const metadata: Metadata = {
  title: recommendationsCopy.label,
  description:
    'Professional recommendations for Jonas Petrik from colleagues and industry peers.',
  alternates: {
    canonical: '/recommendations',
  },
}

export default async function RecommendationsPage() {
  return (
    <Container className="mt-10 sm:mt-16">
      <TerminalPageHeader
        command="cat"
        argument={recommendationsCopy.fileName}
        description={recommendationsCopy.pageDescription}
      />

      {/* Recommendations wall */}
      <TestimonialsWall
        recommendations={recommendations}
        allowSorting
        headerLabel={recommendationsCopy.countLabel(recommendations.length)}
      />
    </Container>
  )
}
