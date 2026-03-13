import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { ProfileSocialLinks } from '@/components/ProfileSocialLinks'
import { TerminalPageHeader } from '@/components/TerminalHeader'
import { TechStack } from '@/components/TechStack'
import portraitImage from '@/images/jonas-petrik-portrait-2.jpg'
import { calculateTotalExperienceYears, WorkInterface } from '@/lib/experience'
import work from '@/data/work.json'

const totalExperienceYears = calculateTotalExperienceYears(
  work as WorkInterface[],
)

// Get current employment (first entry in work.json)
const currentEmployment = (work as WorkInterface[])[0]

export const metadata: Metadata = {
  title: 'About',
  description:
    'Jonas Petrik - Staff Engineer leading checkout at SCAYLE (Harrods, Deichmann, 100+ brands). Zero downtime Black Friday, ~550 orders/minute. Based in Germany.',
  alternates: {
    canonical: '/about',
  },
}

export default function About() {
  return (
    <Container className="mt-10 sm:mt-16">
      <TerminalPageHeader
        command="cat"
        argument="about.md"
        description="A deeper look into who I am"
      />

      {/* Main card */}
      <div className="max-w-3xl">
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white/90 dark:border-neutral-700 dark:bg-neutral-900/90">
          {/* Terminal header */}
          <div className="flex h-6 items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
              ~/about.md
            </span>
          </div>

          <div className="p-5 sm:p-6">
            {/* Header section with portrait */}
            <div className="mb-8 flex flex-col items-center gap-6 border-b border-neutral-200 pb-8 sm:flex-row sm:items-start dark:border-neutral-700">
              {/* Portrait */}
              <div className="flex-shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-xl shadow-lg ring-4 ring-white sm:h-32 sm:w-32 dark:ring-neutral-800">
                  <Image
                    src={portraitImage}
                    alt="Jonas Petrik - Staff Engineer and Team Lead"
                    sizes="(min-width: 640px) 8rem, 7rem"
                    className="h-full w-full object-cover"
                    priority={false}
                  />
                </div>

                <ProfileSocialLinks />
              </div>

              {/* Name and title */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    Staff Engineer / Team Lead
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-800 sm:text-3xl dark:text-neutral-100">
                  Jonas Petrik
                </h2>
                <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-200">
                  Based in Germany · Originally from Lithuania
                </p>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                  {totalExperienceYears}+ years of experience
                </p>
              </div>
            </div>

            {/* Content - readable prose */}
            <div className="prose-neutral prose-sm sm:prose-base prose max-w-none dark:prose-invert">
              <p>
                Hey, I&apos;m Jonas. I lead the checkout team at SCAYLE - the
                platform behind Harrods, Deichmann, and 100+ other brands. Black
                Friday 2025, we handled ~550 orders/minute with zero downtime. I
                got promoted to lead after pushing for quality: design
                documents, proposals, and turning noisy monitoring into alerts I
                can actually sleep through.
              </p>

              <p>
                Lithuanian, based in Germany. {totalExperienceYears}+ years
                building things with PHP, JavaScript, and Go. Before SCAYLE, I
                rebuilt the search at anwalt.de (Germany&apos;s largest legal
                marketplace - 20k+ lawyers, 4M monthly users). Before that, I
                was the technical lead at a dev house building Atobi for a
                Danish startup - scaled the team from 3 to 10 while shipping
                mobile and web apps for Nike and PVH Nordic.
              </p>

              <p>
                I put functionality, maintainability, and performance first -
                the trendy stuff is a bonus, not the goal. When something&apos;s
                not working or is too complicated, I&apos;ll say so. Direct
                communication saves everyone time. As a lead, I wear multiple
                hats: dev, devops, team lead, tech lead - whatever moves the
                project forward.
              </p>

              <p>
                Systems that work at 3am without waking anyone up. Code that the
                next person can actually understand. Teams where people own
                their work and grow. I&apos;ve mentored developers who went on
                to lead their own teams - that&apos;s the work I&apos;m most
                proud of.
              </p>
            </div>

            {/* Connect CTA */}
            <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-700">
              <p className="mb-4 text-sm text-neutral-700 dark:text-neutral-200">
                Whether you&apos;re interested in potential collaborations or
                wish to exchange ideas, feel free to reach out!
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="mailto:jonas@petrik.dev"
                  className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-1.5 font-mono text-sm text-neutral-800 transition-colors hover:border-emerald-300 hover:text-emerald-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:text-emerald-200"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  contact
                </Link>
              </div>
            </div>
          </div>

          {/* Tech Stack from current employment */}
          <TechStack technologies={currentEmployment.technologies} tone="plain" />
        </div>
      </div>
    </Container>
  )
}
