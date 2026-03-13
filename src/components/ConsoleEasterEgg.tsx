'use client'

import { useEffect } from 'react'
import { calculateTotalExperienceYears, WorkInterface } from '@/lib/experience'
import { createBoxLineWithBorders, createEmptyBoxLine } from '@/lib/consoleBox'
import linkedin from '@/data/linkedin.json'
import work from '@/data/work.json'

type JonasConsoleApi = {
  skills: string[]
  yearsOfExperience: number
  contact: () => {
    email: string
    website: string
    linkedin: string
    github: string
    gitlab: string
  }
  hire: () => string
  links: () => {
    website: string
    linkedin: string
    github: string
    gitlab: string
  }
  whoami: () => {
    name: string
    role: string
    location: string
    company: string
    focus: string
  }
}

export function ConsoleEasterEgg() {
  useEffect(() => {
    // Calculate total years of experience dynamically
    const totalExperienceYears = calculateTotalExperienceYears(
      work as WorkInterface[],
    )
    const currentEmployment = (work as WorkInterface[])[0]
    const coreSkills = ['PHP', 'Go', 'TypeScript', 'React']
    const location = (
      currentEmployment.location ?? linkedin.basics.location.address
    ).replace(' - Remote', '')

    const introCard = `
%c┌─────────────────────────────────────────────────────────────┐
${createEmptyBoxLine()}
${createBoxLineWithBorders('console://jonas-petrik')}
${createEmptyBoxLine()}
${createBoxLineWithBorders(linkedin.basics.name)}
${createBoxLineWithBorders(currentEmployment.position)}
${createBoxLineWithBorders(`${location} · ${currentEmployment.name}`)}
${createBoxLineWithBorders('Focus: checkout, reliability, observability')}
${createEmptyBoxLine()}
${createBoxLineWithBorders('Builds systems that work at 3am without waking anyone up.')}
${createEmptyBoxLine()}
└─────────────────────────────────────────────────────────────┘`

    const quickFacts = `
%c┌─────────────────────────────────────────────────────────────┐
${createBoxLineWithBorders(`Stack: ${coreSkills.join(' · ')}`)}
${createBoxLineWithBorders(`${totalExperienceYears}+ years shipping production software`)}
${createBoxLineWithBorders('Scale: €6.5B+/year checkout volume')}
${createBoxLineWithBorders('Proof: zero-downtime Black Friday 2025 (~550 orders/min)')}
${createBoxLineWithBorders(`Contact: ${linkedin.basics.email}`)}
${createEmptyBoxLine()}
└─────────────────────────────────────────────────────────────┘`

    const commandMenu = `
%cAvailable commands:

  jonas.whoami()   -> quick profile summary
  jonas.skills     -> core stack
  jonas.contact()  -> direct contact details
  jonas.links()    -> web + socials
  jonas.hire()     -> open email client

%cTiny disclaimer: yes, I still use console.log() sometimes.
It just tends to happen after the dashboards, traces, and metrics.
`

    const links = {
      website: linkedin.basics.url,
      linkedin: 'https://www.linkedin.com/in/jonas-petrik/',
      github: 'https://github.com/wukis',
      gitlab: 'https://gitlab.com/jonas.petrik',
    }

    // Log everything with styling
    console.log(
      introCard,
      'color: #94a3b8; font-family: monospace; font-size: 12px; line-height: 1.4;',
    )

    console.log(
      quickFacts,
      'color: #cbd5e1; font-family: monospace; font-size: 12px; line-height: 1.4;',
    )

    console.log(
      commandMenu,
      'color: #22c55e; font-family: monospace;',
      'color: #94a3b8; font-family: monospace; font-size: 11px;',
    )

    // Easter egg: define a global helper namespace
    if (typeof window !== 'undefined') {
      const windowWithJonas = window as Window & { jonas?: JonasConsoleApi }
      const jonasApi: JonasConsoleApi = {
        skills: ['PHP', 'Go', 'TypeScript', 'React', 'Kubernetes', 'AWS'],
        yearsOfExperience: totalExperienceYears,
        contact: () => {
          const contact = {
            email: linkedin.basics.email,
            website: linkedin.basics.url,
            linkedin: links.linkedin,
            github: links.github,
            gitlab: links.gitlab,
          }

          console.table(contact)
          return contact
        },
        hire: () => {
          console.log(
            '%cOpening email...',
            'color: #0ea5e9; font-family: monospace;',
          )
          window.open(
            'mailto:jonas@petrik.dev?subject=Found your console easter egg!',
            '_blank',
          )
          return '✉️ Email client opened! Looking forward to hearing from you.'
        },
        links: () => {
          console.table(links)
          return links
        },
        whoami: () => {
          const profile = {
            name: linkedin.basics.name,
            role: currentEmployment.position,
            location,
            company: currentEmployment.name,
            focus: 'Checkout, reliability, and observability',
          }

          console.table(profile)
          return profile
        },
      }

      windowWithJonas.jonas = jonasApi

      console.log(
        '%cTry: jonas.whoami(), jonas.skills, jonas.contact(), jonas.links(), or jonas.hire()',
        'color: #a78bfa; font-size: 11px; font-family: monospace;',
      )
    }
  }, [])

  return null
}
