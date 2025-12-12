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
  description: 'Welcome! I\'m Jonas Petrik, a Senior Software Engineer and Team Lead with a profound passion for developing software solutions that not only meet the immediate needs of our clients but are also designed to be scalable and future-proof.',
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
          <span className="font-mono text-sky-600 dark:text-sky-400">&gt;</span> cat <span className="text-neutral-400 dark:text-neutral-500">about.md</span>
        </h1>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400 font-mono">
          <span className="text-neutral-400 dark:text-neutral-500"># </span>
          A deeper look into who I am
        </p>
      </div>
      
      {/* Main card - similar to homepage */}
      <div className="max-w-4xl">
        <div className="rounded-lg overflow-hidden border border-sky-500/30 dark:border-sky-400/30 bg-white/50 dark:bg-neutral-900/50">
          {/* Terminal header */}
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              ~/about.md
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-400/10">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              markdown
            </div>
          </div>
          
          <div className="p-5 sm:p-6">
            {/* Header section with portrait */}
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-8 pb-8 border-b border-neutral-200 dark:border-neutral-700">
              {/* Portrait */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden ring-4 ring-white dark:ring-neutral-800 shadow-lg">
                  <Image
                    src={portraitImage}
                    alt="Jonas Petrik - Senior Software Engineer and Team Lead"
                    sizes="(min-width: 640px) 9rem, 8rem"
                    className="w-full h-full object-cover"
                    priority={false}
                  />
                </div>
                
                {/* Social icons - compact row */}
                <div className="mt-3 flex flex-row gap-1.5 justify-center">
                  <Link 
                    href="mailto:jonas@petrik.dev" 
                    className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-500/20 dark:hover:bg-emerald-400/20 transition-colors"
                    aria-label="Email"
                  >
                    <MailIcon className="w-4 h-4 fill-neutral-500 dark:fill-neutral-400" />
                  </Link>
                  <Link 
                    href="https://www.linkedin.com/in/jonas-petrik/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-sky-500/20 dark:hover:bg-sky-400/20 transition-colors"
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
                    Senior Software Engineer Team Lead
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                  <span className="font-mono text-sky-600 dark:text-sky-400">&gt;</span> Jonas Petrik
                </h2>
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                  Based in Germany · Originally from Lithuania
                </p>
              </div>
            </div>
            
            {/* Content sections */}
            <div className="space-y-6">
              {/* Introduction */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
                  <span className="text-sky-500 font-mono">##</span> Introduction
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Welcome! I&apos;m Jonas Petrik, a Senior Software Engineer and Team Lead with a profound passion for developing software solutions that not only meet the immediate needs of our clients but are also designed to be scalable and future-proof. My professional journey has been defined by a blend of technical expertise and leadership roles, primarily focused on PHP, JavaScript, Go, and various other technologies.
                </p>
              </div>
              
              {/* Background */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
                  <span className="text-emerald-500 font-mono">##</span> Background
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Born in Lithuania and currently based in Germany, I&apos;ve had the privilege of leading development teams at renowned tech firms. My role involves deep engagement in all phases of the software development lifecycle, from initial design to deployment, ensuring robustness and high quality of our web platforms.
                </p>
              </div>
              
              {/* Philosophy */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
                  <span className="text-violet-500 font-mono">##</span> Philosophy
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Throughout my career, I&apos;ve emphasized the importance of team collaboration and agile project management. These principles have guided me in driving my teams towards achieving excellence and innovation in every project we undertake.
                </p>
              </div>
              
              {/* Continuous Learning */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
                  <span className="text-amber-500 font-mono">##</span> Continuous Learning
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  I am also an avid learner and a mentor. I believe in the continuous exchange of knowledge and experiences to foster a learning environment that benefits both my team members and myself.
                </p>
              </div>
              
              {/* Connect CTA */}
              <div className="mt-8 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
                  <span className="text-rose-500 font-mono">##</span> Let&apos;s Connect
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4 text-sm">
                  Whether you&apos;re interested in potential collaborations or wish to exchange ideas, feel free to reach out!
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link 
                    href="/experience"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 font-mono text-sm hover:bg-sky-500/20 dark:hover:bg-sky-400/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    experience
                  </Link>
                  <Link 
                    href="/recommendations"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400 font-mono text-sm hover:bg-violet-500/20 dark:hover:bg-violet-400/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    testimonials
                  </Link>
                  <Link 
                    href="mailto:jonas@petrik.dev"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 font-mono text-sm hover:bg-emerald-500/20 dark:hover:bg-emerald-400/20 transition-colors"
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
      </div>
    </Container>
  )
}
