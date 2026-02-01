import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Container } from '@/components/Container'
import {
  GitHubIcon,
  LinkedInIcon,
  GitLabIcon
} from '@/components/SocialIcons'
import portraitImage from '@/images/jonas-petrik-portrait-2.jpg'
import { calculateTotalExperienceYears, WorkInterface } from '@/lib/experience'
import work from '@/data/work.json'

const totalExperienceYears = calculateTotalExperienceYears(work as WorkInterface[])

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
  description: 'Jonas Petrik - Staff Engineer leading checkout at SCAYLE (Harrods, Deichmann, 100+ brands). Zero downtime Black Friday, ~550 orders/minute. Based in Germany.',
  alternates: {
    canonical: '/about',
  },
}

export default function About() {
  return (
    <Container className="mt-10 sm:mt-16">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
          <span className="font-mono text-sky-600 dark:text-sky-400">&gt;</span> cat <span className="text-neutral-500 dark:text-neutral-400">ABOUT.md</span>
        </h1>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400 font-mono">
          <span className="text-neutral-500 dark:text-neutral-400"># </span>
          A deeper look into who I am
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-3xl">
        <div className="rounded-lg overflow-hidden border border-sky-500/30 dark:border-sky-400/30 bg-white/50 dark:bg-neutral-900/50">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 h-6 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
            <span className="text-[10px] font-mono text-neutral-600 dark:text-neutral-300 truncate">
              ~/ABOUT.md
            </span>
          </div>

          <div className="p-5 sm:p-6">
            {/* Header section with portrait */}
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-8 pb-8 border-b border-neutral-200 dark:border-neutral-700">
              {/* Portrait */}
              <div className="flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden ring-4 ring-white dark:ring-neutral-800 shadow-lg">
                  <Image
                    src={portraitImage}
                    alt="Jonas Petrik - Staff Engineer and Team Lead"
                    sizes="(min-width: 640px) 8rem, 7rem"
                    className="w-full h-full object-cover"
                    priority={false}
                  />
                </div>

                {/* Social icons */}
                <div className="mt-3 flex flex-row gap-1.5 justify-center">
                  <Link
                    href="mailto:jonas@petrik.dev"
                    className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-500/30 dark:hover:bg-emerald-400/30 transition-colors"
                    aria-label="Email"
                  >
                    <MailIcon className="w-4 h-4 fill-neutral-500 dark:fill-neutral-400" />
                  </Link>
                  <Link
                    href="https://www.linkedin.com/in/jonas-petrik/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-sky-500/30 dark:hover:bg-sky-400/30 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <LinkedInIcon className="w-4 h-4 fill-neutral-500 dark:fill-neutral-400" />
                  </Link>
                  <Link
                    href="https://github.com/wukis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    aria-label="GitHub"
                  >
                    <GitHubIcon className="w-4 h-4 fill-neutral-500 dark:fill-neutral-400" />
                  </Link>
                  <Link
                    href="https://gitlab.com/jonas.petrik"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-orange-500/20 dark:hover:bg-orange-400/20 transition-colors"
                    aria-label="GitLab"
                  >
                    <GitLabIcon className="w-4 h-4 fill-neutral-500 dark:fill-neutral-400" />
                  </Link>
                </div>
              </div>

              {/* Name and title */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Staff Engineer / Team Lead
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                  Jonas Petrik
                </h2>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                  Based in Germany · Originally from Lithuania
                </p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {totalExperienceYears}+ years of experience
                </p>
              </div>
            </div>

            {/* Content - readable prose */}
            <div className="prose prose-neutral dark:prose-invert prose-sm sm:prose-base max-w-none">
              <p>
                Hey, I&apos;m Jonas. I lead the checkout team at SCAYLE - the platform behind Harrods, Deichmann, and 100+ other brands. Black Friday 2025, we handled ~550 orders/minute with zero downtime. I got promoted to lead after pushing for quality: design documents, proposals, and turning noisy monitoring into alerts I can actually sleep through.
              </p>

              <p>
                Lithuanian, based in Germany. {totalExperienceYears}+ years building things with PHP, JavaScript, and Go. Before SCAYLE, I rebuilt the search at anwalt.de (Germany&apos;s largest legal marketplace - 20k+ lawyers, 4M monthly users). Before that, I was the technical lead at a dev house building Atobi for a Danish startup - scaled the team from 3 to 10 while shipping mobile and web apps for Nike and PVH Nordic.
              </p>

              <p>
                I put functionality, maintainability, and performance first - the trendy stuff is a bonus, not the goal. When something&apos;s not working or is too complicated, I&apos;ll say so. Direct communication saves everyone time. As a lead, I wear multiple hats: dev, devops, team lead, tech lead - whatever moves the project forward.
              </p>

              <p>
                Systems that work at 3am without waking anyone up. Code that the next person can actually understand. Teams where people own their work and grow. I&apos;ve mentored developers who went on to lead their own teams - that&apos;s the work I&apos;m most proud of.
              </p>
            </div>

            {/* Connect CTA */}
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
                Whether you&apos;re interested in potential collaborations or wish to exchange ideas, feel free to reach out!
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/experience"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/30 dark:bg-violet-400/30 text-violet-800 dark:text-violet-200 font-mono text-sm hover:bg-violet-500/40 dark:hover:bg-violet-400/40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  experience
                </Link>
                <Link
                  href="/recommendations"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/30 dark:bg-amber-400/30 text-amber-800 dark:text-amber-200 font-mono text-sm hover:bg-amber-500/40 dark:hover:bg-amber-400/40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  testimonials
                </Link>
                <Link
                  href="mailto:jonas@petrik.dev"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/30 dark:bg-emerald-400/30 text-emerald-800 dark:text-emerald-200 font-mono text-sm hover:bg-emerald-500/40 dark:hover:bg-emerald-400/40 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
