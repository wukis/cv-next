import linkedin from '@/data/linkedin.json'
import recommendations from '@/data/recommendations.json'
import work from '@/data/work.json'
import { type RecommendationInterface } from '@/lib/recommendations'
import { type WorkInterface } from '@/lib/experience'

export const siteUrl = 'https://petrik.dev'
export const publicEmail = 'jonas@petrik.dev'

export const seoDescription =
  'Staff engineer leading checkout at SCAYLE, focused on backend, platform reliability, and high-availability commerce systems. I build systems that stay calm during peak traffic, reduce on-call noise, and keep teams shipping.'

export const seoKeywords = [
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
]

export const personKnowsAbout = [
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
]

export const heroIntro = [
  'I lead checkout at SCAYLE, working on backend and platform problems inside a commerce platform serving Harrods, Deichmann, and 100+ brands.',
  'My focus is payment-critical reliability, pragmatic architecture, and reducing operational noise so teams can ship fast without creating 3am problems.',
]

export const homeImpactCards = [
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
] as const

export const selectedImpactStories = [
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
] as const

export const aboutNarrative = [
  'I am a staff-level engineer who grew into leadership by taking responsibility for systems that need to work under pressure. At SCAYLE, that means leading checkout while staying close to the backend and platform details that affect reliability.',
  'My strongest work usually starts where product scale meets operational pain: noisy alerts, brittle flows, unclear ownership, or systems that only look fine until traffic arrives. I like tightening those edges until the system is boring in production.',
  'Before SCAYLE, I rebuilt search at anwalt.de and later helped modernize platform foundations across engineering. Before that, I led delivery for Atobi at Solutionlab, scaling the team from 3 to 10 while keeping architecture and execution practical.',
  'I care about direct communication, understandable systems, and engineering environments where the next person can reason about what is happening. The goal is not flashy tech. The goal is software that keeps working and a team that can keep moving.',
] as const

export const curatedHomepageRecommendationSlugs = [
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

export const publicWork = work as WorkInterface[]
export const allRecommendations = recommendations as RecommendationInterface[]

export function getHomepageRecommendations() {
  const bySlug = new Map(
    allRecommendations.map((recommendation) => [recommendation.slug, recommendation]),
  )

  return curatedHomepageRecommendationSlugs
    .map((slug) => bySlug.get(slug))
    .filter((recommendation): recommendation is RecommendationInterface => Boolean(recommendation))
}

export function sortRecommendationsForDefaultView(
  input: RecommendationInterface[],
) {
  return [...input].sort((left, right) => {
    const leftPriority = recommendationPriority.get(left.slug) ?? Number.MAX_SAFE_INTEGER
    const rightPriority =
      recommendationPriority.get(right.slug) ?? Number.MAX_SAFE_INTEGER

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return new Date(right.date).getTime() - new Date(left.date).getTime()
  })
}

export const publicProfileLinks = [
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
] as const

export const cvSummary =
  'Staff engineer leading checkout at SCAYLE with a backend/platform focus on reliability, observability, and high-availability commerce systems. I build systems that keep working at peak load and help teams ship without creating operational drama.'

export const publicBasics = {
  name: linkedin.basics.name,
  label: linkedin.basics.label,
  email: publicEmail,
  url: siteUrl,
  location: 'Germany',
}
