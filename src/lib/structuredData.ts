import { profileContent } from '@/lib/profileContent'
import { personKnowsAbout, seoDescription, siteUrl } from '@/lib/siteProfile'

export function buildPersonJsonLd() {
  return {
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
    alumniOf: profileContent.education.map((entry) => ({
      '@type': 'EducationOrganization',
      name: entry.institution,
    })),
    worksFor: {
      '@type': 'Organization',
      name: profileContent.currentRole.name,
      url: profileContent.currentRole.url,
    },
    sameAs: profileContent.links.map((profile) => profile.href),
    knowsAbout: personKnowsAbout,
  }
}
