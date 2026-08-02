import { type Metadata } from 'next'

import HomePageContent from '@/components/HomePageContent'
import { profileContent } from '@/lib/profileContent'
import { seoDescription } from '@/lib/siteProfile'
import { buildPersonJsonLd } from '@/lib/structuredData'

export const metadata: Metadata = {
  title: `${profileContent.person.name} - ${profileContent.person.label}`,
  description: seoDescription,
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildPersonJsonLd()),
        }}
      />
      <HomePageContent />
    </>
  )
}
