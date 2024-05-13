import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from '@/components/SocialIcons'
import portraitImage from '@/images/jonas-petrik-portrait-2.jpg'

function SocialLink({
  className,
  href,
  children,
  icon: Icon,
}: {
  className?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        className="group flex text-sm font-medium text-neutral-800 transition hover:text-blue-500 dark:text-neutral-200 dark:hover:text-blue-500"
      >
        <Icon className="h-6 w-6 flex-none fill-neutral-500 transition group-hover:fill-blue-500" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
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
}

export default function About() {
  return (
    <Container className="mt-10">
      <div className="md:grid md:grid-cols-12 gap-y-8 lg:gap-y-8">
        <div className="md:col-span-4 lg:pl-20 md:order-2 md:mt-32">
          <div className="max-w-xs px-2.5 lg:max-w-64">
            <Image
              src={portraitImage}
              alt=""
              sizes="(min-width: 1024px) 32rem, 20rem"
              className="aspect-square rotate-3 rounded-2xl object-cover"
            />
            <ul role="list" className="mt-8 px-6">
              <SocialLink
                  href="mailto:jonas@petrik.dev"
                  icon={MailIcon}
                  className="mt-4"
              >
                jonas@petrik.dev
              </SocialLink>
              <SocialLink href="#" icon={LinkedInIcon} className="mt-4">
                Find me on LinkedIn
              </SocialLink>
              <SocialLink href="#" icon={GitHubIcon} className="mt-4">
                Find me on GitHub
              </SocialLink>
            </ul>
          </div>
        </div>
        <div className="md:col-span-8 bg-neutral-50/50 dark:bg-neutral-800/25 p-8">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
            Hey there, a little bit about me
          </h1>
          <div className="mt-6 space-y-7 text-base text-neutral-800 dark:text-neutral-200">
            <p>
              Welcome! I&apos;m Jonas Petrik, a Senior Software Engineer and Team Lead with a profound passion for developing software solutions that not only meet the immediate needs of our clients but are also designed to be scalable and future-proof. My professional journey has been defined by a blend of technical expertise and leadership roles, primarily focused on PHP, JavaScript, Go, and various other technologies. Dive into my portfolio at petrik.dev to explore my work and the impact it has had across various industries.
            </p>

            <p>
              Born in Lithuania and currently based in Germany, I&apos;ve had the privilege of leading development teams at renowned tech firms, including anwalt.de, where I currently spearhead initiatives to enhance software architecture and integrate advanced technology solutions. My role involves deep engagement in all phases of the software development lifecycle, from initial design to deployment, ensuring robustness and high quality of our web platforms.
            </p>

            <p>
              Throughout my career, I&apos;ve emphasized the importance of team collaboration and agile project management. These principles have guided me in driving my teams towards achieving excellence and innovation in every project we undertake. At anwalt.de, I&apos;ve played a pivotal role in transforming our digital platforms, making them more intuitive and accessible for users, and thereby significantly enhancing customer satisfaction.
            </p>

            <p>
              I am also an avid learner and a mentor. I believe in the continuous exchange of knowledge and experiences to foster a learning environment that benefits both my team members and myself.
            </p>

            <p>
              Thank you for visiting my page. Whether you&apos;re interested in potential collaborations or wish to exchange ideas, feel free to connect with me on LinkedIn or reach out directly through my contact details available here. I look forward to exploring how we can work together to create exceptional solutions that drive success.
            </p>
          </div>
        </div>
      </div>
    </Container>
  )
}
