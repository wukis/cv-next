'use client'

import Link from 'next/link'

import { surfaceHoverMotionClassName } from '@/components/interactionStyles'
import { GitHubIcon, GitLabIcon, LinkedInIcon } from '@/components/SocialIcons'

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

const socialLinkClassName =
  `rounded-md border border-neutral-300 bg-neutral-100 p-1.5 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-700 ${surfaceHoverMotionClassName}`

export function ProfileSocialLinks() {
  return (
    <div className="mt-3 flex flex-row justify-center gap-1.5">
      <Link
        href="mailto:jonas@petrik.dev"
        className={socialLinkClassName}
        aria-label="Email"
      >
        <MailIcon className="h-4 w-4 fill-current" />
      </Link>
      <Link
        href="https://www.linkedin.com/in/jonas-petrik/"
        target="_blank"
        rel="noopener noreferrer"
        className={socialLinkClassName}
        aria-label="LinkedIn"
      >
        <LinkedInIcon className="h-4 w-4 fill-current" />
      </Link>
      <Link
        href="https://github.com/wukis"
        target="_blank"
        rel="noopener noreferrer"
        className={socialLinkClassName}
        aria-label="GitHub"
      >
        <GitHubIcon className="h-4 w-4 fill-current" />
      </Link>
      <Link
        href="https://gitlab.com/jonas.petrik"
        target="_blank"
        rel="noopener noreferrer"
        className={socialLinkClassName}
        aria-label="GitLab"
      >
        <GitLabIcon className="h-4 w-4 fill-current" />
      </Link>
    </div>
  )
}
