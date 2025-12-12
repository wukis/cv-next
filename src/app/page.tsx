import { type Metadata } from 'next'
import HomeClientContent from '@/components/HomeClientContent'
import linkedin from '@/data/linkedin.json'

export const metadata: Metadata = {
    title: linkedin.basics.name + ' - ' + linkedin.basics.label,
    description: linkedin.basics.summary,
    alternates: {
        canonical: '/',
    },
}

// JSON-LD structured data for Person schema
const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: linkedin.basics.name,
    url: 'https://petrik.dev',
    image: 'https://petrik.dev/jonas-petrik-portrait.png',
    email: linkedin.basics.email,
    jobTitle: linkedin.basics.label,
    description: linkedin.basics.summary,
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
        name: 'anwalt.de',
        url: 'https://www.anwalt.de',
    },
    sameAs: [
        'https://www.linkedin.com/in/jonas-petrik/',
        'https://github.com/wukis',
        'https://gitlab.com/jonas.petrik',
    ],
    knowsAbout: [
        'PHP',
        'JavaScript',
        'Go',
        'Vue.js',
        'React',
        'MySQL',
        'Software Architecture',
        'Team Leadership',
        'DevOps',
        'AWS',
    ],
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
