import { type WorkInterface } from '@/lib/experience'
import { profileContent } from '@/lib/profileContent'

function normalizeDate(date: string) {
  return date === 'now' ? date : `${date}-01`
}

function dedupeTechnologies(work: WorkInterface[]) {
  const seen = new Set<string>()
  const technologies: string[] = []

  for (const role of work) {
    for (const technology of role.technologies) {
      const key = technology.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        technologies.push(technology)
      }
    }
  }

  return technologies
}

export function buildPublicResume() {
  const technologies = dedupeTechnologies(profileContent.work)

  return {
    $schema:
      'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: profileContent.person.name,
      label: profileContent.person.label,
      email: profileContent.person.email,
      url: profileContent.person.website,
      summary: profileContent.person.summary,
      location: {
        countryCode: 'DE',
        address: profileContent.person.location,
      },
      profiles: profileContent.links.map((profile) => ({
        network: profile.label,
        url: profile.href,
      })),
    },
    work: profileContent.work.map((role) => ({
      name: role.name,
      position: role.position,
      startDate: normalizeDate(role.startDate),
      endDate: normalizeDate(role.endDate),
      summary: role.scope ?? '',
      highlights: [...role.highlights, ...role.responsibilities],
      url: role.url,
      location: role.location ?? '',
    })),
    education: profileContent.education.map((entry) => ({
      institution: entry.institution,
      area: entry.area,
      studyType: entry.studyType,
      startDate: entry.startDate,
      endDate: entry.endDate,
    })),
    skills: [
      {
        name: 'Backend and Platform Engineering',
        keywords: technologies.filter((technology) =>
          [
            'PHP',
            'Go',
            'Symfony',
            'Laravel',
            'MySQL',
            'Redis',
            'REST',
            'gRPC',
          ].includes(technology),
        ),
      },
      {
        name: 'Infrastructure and Reliability',
        keywords: technologies.filter((technology) =>
          [
            'Kubernetes',
            'Docker',
            'AWS',
            'Datadog',
            'Terraform',
            'SQS',
            'SNS',
            'GitLab CI',
          ].includes(technology),
        ),
      },
      {
        name: 'Frontend and Delivery',
        keywords: technologies.filter((technology) =>
          [
            'React',
            'TypeScript',
            'Vue.js',
            'Jest',
            'Playwright',
            'Cypress',
            'k6',
          ].includes(technology),
        ),
      },
      {
        name: 'Core strengths',
        keywords: profileContent.expertise.keywords,
      },
    ],
    meta: {
      canonical: `${profileContent.site.url}/resume.json`,
      generatedFrom: `${profileContent.site.url}/cv`,
    },
  }
}
