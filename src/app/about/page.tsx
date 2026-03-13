import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { TechStack } from '@/components/TechStack'
import { GitHubIcon, LinkedInIcon, GitLabIcon } from '@/components/SocialIcons'
import portraitImage from '@/images/jonas-petrik-portrait-2.jpg'
import { calculateTotalExperienceYears, WorkInterface } from '@/lib/experience'
import work from '@/data/work.json'

const totalExperienceYears = calculateTotalExperienceYears(
  work as WorkInterface[],
)

// Get current employment (first entry in work.json)
const currentEmployment = (work as WorkInterface[])[0]

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fillRule="evenodd"
        d="M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z"
      />
    </svg>
  )
}

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
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-800 sm:text-4xl lg:text-5xl dark:text-neutral-100">
          <span className="font-mono text-sky-600 dark:text-sky-400">&gt;</span>{' '}
          cat{' '}
          <span className="text-neutral-500 dark:text-neutral-400">
            ABOUT.md
          </span>
        </h1>
        <p className="mt-3 font-mono text-lg text-neutral-600 dark:text-neutral-400">
          <span className="text-neutral-500 dark:text-neutral-400"># </span>A
          deeper look into who I am
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-3xl">
        <div className="overflow-hidden rounded-lg border border-sky-300 bg-white/90 dark:border-sky-700 dark:bg-neutral-900/90">
          {/* Terminal header */}
          <div className="flex h-6 items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="truncate font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
              ~/ABOUT.md
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

                {/* Social icons */}
                <div className="mt-3 flex flex-row justify-center gap-1.5">
                  <Link
                    href="mailto:jonas@petrik.dev"
                    className="rounded-md border border-neutral-300 bg-neutral-100 p-1.5 transition-colors hover:bg-emerald-100 hover:text-emerald-900 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-emerald-950/70 dark:hover:text-emerald-100"
                    aria-label="Email"
                  >
                    <MailIcon className="h-4 w-4 fill-neutral-700 dark:fill-neutral-200" />
                  </Link>
                  <Link
                    href="https://www.linkedin.com/in/jonas-petrik/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-neutral-300 bg-neutral-100 p-1.5 transition-colors hover:bg-sky-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-sky-950/70"
                    aria-label="LinkedIn"
                  >
                    <LinkedInIcon className="h-4 w-4 fill-neutral-700 dark:fill-neutral-200" />
                  </Link>
                  <Link
                    href="https://github.com/wukis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-neutral-300 bg-neutral-100 p-1.5 transition-colors hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                    aria-label="GitHub"
                  >
                    <GitHubIcon className="h-4 w-4 fill-neutral-700 dark:fill-neutral-200" />
                  </Link>
                  <Link
                    href="https://gitlab.com/jonas.petrik"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-neutral-300 bg-neutral-100 p-1.5 transition-colors hover:bg-orange-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-orange-950/70"
                    aria-label="GitLab"
                  >
                    <GitLabIcon className="h-4 w-4 fill-neutral-700 dark:fill-neutral-200" />
                  </Link>
                </div>
              </div>

              {/* Name and title */}
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 font-mono text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
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
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-1.5 font-mono text-sm text-emerald-950 transition-colors hover:bg-emerald-200 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-100 dark:hover:bg-emerald-900/80"
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
