import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { RecommendationsWall } from '@/components/RecommendationsWall'
import { TerminalPageHeader } from '@/components/TerminalHeader'
import recommendations from '@/data/recommendations.json'
import { recommendationsCopy } from '@/lib/recommendationsCopy'

export const metadata: Metadata = {
  title: recommendationsCopy.label,
  description:
    'Professional recommendations for Jonas Petrik, with emphasis on backend, platform, leadership, and reliability work.',
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
      <RecommendationsWall
        recommendations={recommendations}
        allowSorting
        headerLabel={recommendationsCopy.countLabel(recommendations.length)}
      />
    </Container>
  )
}
