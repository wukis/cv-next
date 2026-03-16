import linkedin from '@/data/linkedin.json'
import recommendations from '@/data/recommendations.json'
import work from '@/data/work.json'
import { getRequiredValue } from '@/lib/assert'
import {
  calculateTotalExperienceYears,
  type EducationInterface,
  type WorkInterface,
} from '@/lib/experience'
import { type RecommendationInterface } from '@/lib/recommendations'

export interface ProfileLink {
  label: string
  href: string
}

export interface ImpactCard {
  value: string
  label: string
  detail: string
}

export interface ImpactStory {
  title: string
  context: string
  role: string
  impact: string
  evidence: string
}

const publicWork = work as WorkInterface[]
const education = linkedin.education as EducationInterface[]
const recommendationEntries = recommendations as RecommendationInterface[]
const currentRole = getRequiredValue(
  publicWork[0],
  'Expected at least one work entry in profile content.',
)

const curatedHomepageRecommendationSlugs = [
  'daniel-motzev',
  'simon-sattes',
  'martin-will',
  'roman-iudin',
  'andrei-lungu',
  'osman-turan',
] as const

const defaultRecommendationPriority = [
  ...curatedHomepageRecommendationSlugs,
  'milan-ristic',
  'gintare-kaubryte',
  'henrikas-girdzijauskas',
] as const

const recommendationPriority = new Map<string, number>(
  defaultRecommendationPriority.map((slug, index) => [slug, index]),
)

export const profileContent = {
  site: {
    url: 'https://petrik.dev',
    email: 'jonas@petrik.dev',
  },
  person: {
    name: linkedin.basics.name,
    label: linkedin.basics.label,
    email: 'jonas@petrik.dev',
    website: 'https://petrik.dev',
    location: 'Germany',
    locationSummary: 'Based in Germany, originally from Lithuania.',
    summary:
      'Staff engineer leading checkout at SCAYLE with a backend/platform focus on reliability, observability, and high-availability commerce systems. I build systems that keep working at peak load and help teams ship without creating operational drama.',
  },
  seo: {
    description:
      'Staff engineer leading checkout at SCAYLE, focused on backend, platform reliability, and high-availability commerce systems. I build systems that stay calm during peak traffic, reduce on-call noise, and keep teams shipping.',
    keywords: [
      'Jonas Petrik',
      'Staff Backend Engineer',
      'Staff Platform Engineer',
      'Platform Reliability',
      'Commerce Infrastructure',
      'Checkout Systems',
      'Software Architecture',
      'PHP',
      'Go',
      'Kubernetes',
      'AWS',
    ],
  },
  expertise: {
    keywords: [
      'PHP',
      'Go',
      'Kubernetes',
      'AWS',
      'MySQL',
      'Redis',
      'Datadog',
      'Platform Reliability',
      'Commerce Infrastructure',
      'Checkout Systems',
      'Observability',
      'Incident Response',
      'Software Architecture',
      'Team Leadership',
    ],
  },
  narratives: {
    heroIntro: [
      'I lead checkout at SCAYLE, working on backend and platform problems inside a commerce platform serving Harrods, Deichmann, and 100+ brands.',
      'My focus is payment-critical reliability, pragmatic architecture, and reducing operational noise so teams can ship fast without creating 3am problems.',
    ],
    aboutNarrative: [
      'I am a staff-level engineer who grew into leadership by taking responsibility for systems that need to work under pressure. At SCAYLE, that means leading checkout while staying close to the backend and platform details that affect reliability.',
      'My strongest work usually starts where product scale meets operational pain: noisy alerts, brittle flows, unclear ownership, or systems that only look fine until traffic arrives. I like tightening those edges until the system is boring in production.',
      'Before SCAYLE, I rebuilt search at anwalt.de and later helped modernize platform foundations across engineering. Before that, I led delivery for Atobi at Solutionlab, scaling the team from 3 to 10 while keeping architecture and execution practical.',
      'I care about direct communication, understandable systems, and engineering environments where the next person can reason about what is happening. The goal is not flashy tech. The goal is software that keeps working and a team that can keep moving.',
    ],
  },
  highlights: {
    homeImpactCards: [
      {
        value: '~550/min',
        label: 'Black Friday checkout peak',
        detail:
          'Helped prepare and run checkout during Black Friday 2025 with zero downtime in the area I was responsible for.',
      },
      {
        value: '€6.5B+',
        label: 'platform yearly volume',
        detail:
          'Worked in the checkout part of a commerce platform processing this volume each year.',
      },
      {
        value: '4M+',
        label: 'anwalt.de monthly users',
        detail:
          'Rebuilt search for a marketplace used by more than 4 million people each month.',
      },
      {
        value: '3 -> 10',
        label: 'team growth',
        detail:
          'Helped grow the Atobi team from 3 to 10 engineers while staying hands-on with architecture.',
      },
    ] as const satisfies readonly ImpactCard[],
    selectedImpactStories: [
      {
        title: 'Checkout reliability and observability',
        context:
          'At SCAYLE, I took ownership of on-call quality for a payment-critical checkout domain.',
        role: 'I focused on alert quality, observability, and the failure paths that were waking people up for the wrong reasons.',
        impact:
          'The result was a calmer on-call setup with more trustworthy alerts and less operational noise.',
        evidence:
          'That work became part of the reason I was promoted into the current lead role.',
      },
      {
        title: 'Black Friday 2025 preparation',
        context:
          'Checkout had to stay stable through the most demanding commerce event of the year.',
        role: 'I helped prepare and operate the domain around peak traffic, with attention to multi-step state changes, incident response, and runtime behavior under load.',
        impact:
          'Peak tenants handled roughly 550 orders per minute during Black Friday 2025 with zero downtime in the domain I was responsible for.',
        evidence:
          'The site now frames that number as domain impact, not as a blanket claim over the whole business.',
      },
      {
        title: 'anwalt.de search rebuild and platform modernization',
        context:
          'anwalt.de needed stronger search capabilities and better foundations for future product work.',
        role: 'I rebuilt search around GraphQL, geolocation, aggregations, and range filters, then stepped into broader team lead and platform work.',
        impact:
          'That work improved a core marketplace experience and led into architectural, CI/CD, and mentoring responsibilities adopted across the team.',
        evidence:
          'It is one of the clearest examples of individual technical ownership that later expanded into leadership scope.',
      },
    ] as const satisfies readonly ImpactStory[],
  },
  links: [
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/jonas-petrik/',
    },
    {
      label: 'GitHub',
      href: 'https://github.com/wukis',
    },
    {
      label: 'GitLab',
      href: 'https://gitlab.com/jonas.petrik',
    },
  ] as const satisfies readonly ProfileLink[],
  work: publicWork,
  currentRole,
  experienceYears: calculateTotalExperienceYears(publicWork),
  education,
  recommendations: recommendationEntries,
}

export function getHomepageRecommendations() {
  const bySlug = new Map(
    profileContent.recommendations.map((recommendation) => [
      recommendation.slug,
      recommendation,
    ]),
  )

  return curatedHomepageRecommendationSlugs
    .map((slug) => bySlug.get(slug))
    .filter((recommendation): recommendation is RecommendationInterface =>
      Boolean(recommendation),
    )
}
