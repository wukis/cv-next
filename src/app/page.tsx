import { type Metadata } from 'next'
import HomeClientContent from '@/components/HomeClientContent'
import linkedin from '@/data/linkedin.json'
import { personKnowsAbout, seoDescription, siteUrl } from '@/lib/siteProfile'

export const metadata: Metadata = {
  title: linkedin.basics.name + ' - ' + linkedin.basics.label,
  description: seoDescription,
  alternates: {
    canonical: '/',
  },
}

// JSON-LD structured data for Person schema
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: linkedin.basics.name,
  url: siteUrl,
  image: `${siteUrl}/jonas-petrik-portrait.png`,
  email: linkedin.basics.email,
  jobTitle: linkedin.basics.label,
  description: seoDescription,
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'Germany',
  },
  alumniOf: {
    '@type': 'EducationOrganization',
    name: 'Vilniaus Universitetas',
  },
  worksFor: {
    '@type': 'Organization',
    name: 'SCAYLE',
    url: 'https://www.scayle.com',
  },
  sameAs: [
    'https://www.linkedin.com/in/jonas-petrik/',
    'https://github.com/wukis',
    'https://gitlab.com/jonas.petrik',
  ],
  knowsAbout: personKnowsAbout,
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClientContent />
    </>
  )
}
