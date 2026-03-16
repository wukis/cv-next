import { type Metadata } from 'next'
import HomePageContent from '@/components/HomePageContent'
import { profileContent } from '@/lib/profileContent'
import { personKnowsAbout, seoDescription, siteUrl } from '@/lib/siteProfile'

export const metadata: Metadata = {
  title: `${profileContent.person.name} - ${profileContent.person.label}`,
  description: seoDescription,
  alternates: {
    canonical: '/',
  },
}

// JSON-LD structured data for Person schema
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profileContent.person.name,
  url: siteUrl,
  image: `${siteUrl}/jonas-petrik-portrait.png`,
  email: profileContent.person.email,
  jobTitle: profileContent.person.label,
  description: seoDescription,
  address: {
    '@type': 'PostalAddress',
    addressCountry: profileContent.person.location,
  },
  alumniOf: {
    '@type': 'EducationOrganization',
    name: profileContent.education[0]?.institution ?? 'Vilniaus Universitetas',
  },
  worksFor: {
    '@type': 'Organization',
    name: profileContent.currentRole.name,
    url: profileContent.currentRole.url,
  },
  sameAs: profileContent.links.map((profile) => profile.href),
  knowsAbout: personKnowsAbout,
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageContent />
    </>
  )
}
