import { type Metadata } from 'next'

import ExperienceClientContent from '@/components/ExperienceClientPage'

export const metadata: Metadata = {
  title: 'Experience',
  description:
    'Professional experience of Jonas Petrik across checkout, backend systems, platform reliability, search, and engineering leadership.',
  alternates: {
    canonical: '/experience',
  },
}

export default function ExperiencePage() {
  return <ExperienceClientContent />
}
