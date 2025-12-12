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

function SocialLink({
  href,
  target,
  children,
  icon: Icon,
  label,
}: {
  href: string,
  target?: string,
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
    >
      <Icon className="h-5 w-5 flex-none fill-neutral-500 transition-colors group-hover:fill-sky-500 dark:fill-neutral-400" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-mono text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 truncate block">{children}</span>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">{label}</span>
      </div>
      <svg className="w-4 h-4 text-neutral-400 group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </Link>
  )
}

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
      
      <div className="md:grid md:grid-cols-12 gap-8 lg:gap-12">
        {/* Sidebar - Portrait & Contact */}
        <div className="md:col-span-4 lg:col-span-3 md:order-2">
          <div className="sticky top-8 space-y-6">
            {/* Portrait card */}
            <div className="rounded-lg overflow-hidden border border-neutral-200/60 dark:border-neutral-700/50 bg-white/50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-2 px-3 h-6 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                  ~/images/portrait.jpg
                </span>
              </div>
              <div className="p-2">
                <Image
                  src={portraitImage}
                  alt="Jonas Petrik - Senior Software Engineer and Team Lead"
                  sizes="(min-width: 1024px) 32rem, 20rem"
                  className="aspect-square rounded-lg object-cover"
                  priority={false}
                />
              </div>
            </div>
            
            {/* Contact links */}
            <div className="rounded-lg overflow-hidden border border-neutral-200/60 dark:border-neutral-700/50 bg-white/50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-2 px-3 h-6 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                  ~/contact/
                </span>
              </div>
              <div className="p-3 space-y-2">
                <Link
                  href="mailto:jonas@petrik.dev"
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-500/10 dark:hover:bg-emerald-400/10 transition-colors"
                >
                  <MailIcon className="h-5 w-5 flex-none fill-neutral-500 transition-colors group-hover:fill-emerald-500 dark:fill-neutral-400" />
                  <span className="text-sm font-mono text-neutral-600 dark:text-neutral-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">jonas@petrik.dev</span>
                </Link>
                <SocialLink href="https://www.linkedin.com/in/jonas-petrik/" target="_blank" icon={LinkedInIcon} label="Professional network">
                  linkedin.com/in/jonas-petrik
                </SocialLink>
                <SocialLink href="https://github.com/wukis" target="_blank" icon={GitHubIcon} label="Open source projects">
                  github.com/wukis
                </SocialLink>
                <SocialLink href="https://gitlab.com/jonas.petrik" target="_blank" icon={GitLabIcon} label="Code repositories">
                  gitlab.com/jonas.petrik
                </SocialLink>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="md:col-span-8 lg:col-span-9 mt-8 md:mt-0">
          {/* Bio card */}
          <div className="rounded-lg overflow-hidden border border-sky-500/30 dark:border-sky-400/30 bg-white/50 dark:bg-neutral-900/50">
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                ~/docs/about.md
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-400/10">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                markdown
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {/* Section 1 */}
                <div className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                    <span className="text-sky-500 font-mono">##</span> Introduction
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Welcome! I&apos;m Jonas Petrik, a Senior Software Engineer and Team Lead with a profound passion for developing software solutions that not only meet the immediate needs of our clients but are also designed to be scalable and future-proof. My professional journey has been defined by a blend of technical expertise and leadership roles, primarily focused on PHP, JavaScript, Go, and various other technologies. Dive into my portfolio at petrik.dev to explore my work and the impact it has had across various industries.
                  </p>
                </div>
                
                {/* Section 2 */}
                <div className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                    <span className="text-emerald-500 font-mono">##</span> Background
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Born in Lithuania and currently based in Germany, I&apos;ve had the privilege of leading development teams at renowned tech firms, including anwalt.de, where I currently spearhead initiatives to enhance software architecture and integrate advanced technology solutions. My role involves deep engagement in all phases of the software development lifecycle, from initial design to deployment, ensuring robustness and high quality of our web platforms.
                  </p>
                </div>
                
                {/* Section 3 */}
                <div className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                    <span className="text-violet-500 font-mono">##</span> Philosophy
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    Throughout my career, I&apos;ve emphasized the importance of team collaboration and agile project management. These principles have guided me in driving my teams towards achieving excellence and innovation in every project we undertake. At anwalt.de, I&apos;ve played a pivotal role in transforming our digital platforms, making them more intuitive and accessible for users, and thereby significantly enhancing customer satisfaction.
                  </p>
                </div>
                
                {/* Section 4 */}
                <div className="mb-8">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                    <span className="text-amber-500 font-mono">##</span> Continuous Learning
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    I am also an avid learner and a mentor. I believe in the continuous exchange of knowledge and experiences to foster a learning environment that benefits both my team members and myself.
                  </p>
                </div>
                
                {/* Section 5 */}
                <div className="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
                    <span className="text-rose-500 font-mono">##</span> Let&apos;s Connect
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
                    Thank you for visiting my page. Whether you&apos;re interested in potential collaborations or wish to exchange ideas, feel free to connect with me on LinkedIn or reach out directly through my contact details available here. I look forward to exploring how we can work together to create exceptional solutions that drive success.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link 
                      href="/experience"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 font-mono text-sm hover:bg-sky-500/20 dark:hover:bg-sky-400/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      view experience
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
