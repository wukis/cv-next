import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/Container'
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from '@/components/SocialIcons'
import { type RecommendationInterface } from '@/lib/recommendations'
import portraitImage from '@/images/jonas-petrik-portrait.png'
import recommendations from '@/data/recommendations.json'
import linkedin from '@/data/linkedin.json'
import {useState} from "react";

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

function Recommendations() {
    const displayedRecommendations = recommendations.slice(0, 6);

    return (
        <div className="mx-auto mt-16 max-w-5xl">
            <div className="mx-auto max-w-xl text-center">
                <h2 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">What others say about me</h2>
            </div>
            <div className="mx-auto mt-12 flow-root max-w-2xl lg:mx-0 lg:max-w-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedRecommendations.map((recommendation, index) => (
                        <div key={index} className="pt-4">
                            <Recommendation recommendation={recommendation} />
                        </div>
                    ))}
                </div>
                <div className="text-right mt-4">
                    <a
                        href={`/recommendations`}
                        className="rounded bg-white/25 px-3 py-2 text-sm font-medium text-neutral-800 shadow-lg shadow-neutral-800/5 ring-1 ring-neutral-900/5 backdrop-blur hover:bg-neutral-100 dark:bg-neutral-800/25 dark:text-neutral-200 dark:ring-white/10 dark:hover:bg-neutral-700"
                    >
                        {`Show All (${recommendations.length})`}
                    </a>
                </div>
            </div>
        </div>
    );
}



function SocialLink({
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link className="group -m-1 p-1" {...props}>
      <Icon className="h-6 w-6 fill-neutral-500 transition group-hover:fill-neutral-600 dark:fill-neutral-400 dark:group-hover:fill-neutral-300" />
    </Link>
  )
}

function Recommendation({ recommendation }: { recommendation: RecommendationInterface }) {
  return (
      <a href={`/recommendations#${recommendation.slug}`}>
        <figure className="rounded p-8 text-sm leading-6 bg-neutral-50/50 dark:bg-neutral-800/25">
          <blockquote>
            <p className="line-clamp-3">{`“${recommendation.body}”`}</p>
          </blockquote>
            <div className="font-light text-xs italic text-right">{recommendation.date}</div>

          <figcaption className="mt-6 flex items-center gap-x-4">
            <Image
                className="h-18 w-18 rounded"
                width={40}
                height={40}
                src={require(`@/images/recommendations/${recommendation.image}`).default}
                alt={recommendation.fullName}
            />
            <div>
              <div className="font-semibold line-clamp-1">{recommendation.fullName}</div>
              <div className="font-light line-clamp-1">{recommendation.position}</div>
            </div>
          </figcaption>

        </figure>
      </a>
  )
}

export default async function Home() {
  return (
    <>
      <Container className="mt-10">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 max-w-xs px-2.5 lg:max-w-52 items-center">
            <Image
                src={portraitImage}
                alt="Jonas Petrik"
                sizes="(min-width: 1024px) 32rem, 20rem"
                className="aspect-square rotate-3 rounded-2xl object-cover"
                priority={false}
            />
            <div className="mt-4 flex gap-6">
                <SocialLink href="mailto:jonas@petrik.dev" icon={MailIcon}  aria-label="Email me" />
                <SocialLink href="https://www.linkedin.com/in/jonas-petrik/" target="_blank" aria-label="Find me on LinkedIn" icon={LinkedInIcon} />
                <SocialLink href="https://github.com/wukis" target="_blank" aria-label="Find me on GitHub" icon={GitHubIcon} />
            </div>
          </div>
          <div className="p-8 flex-1 bg-neutral-50/50 dark:bg-neutral-800/25">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
              I&apos;m {linkedin.basics.name} - { linkedin.basics.label }
            </h1>
            <p className="mt-6 text-base text-neutral-600 dark:text-neutral-400">
              { linkedin.basics.summary }
            </p>
          </div>

        </div>
      </Container>
      <Recommendations />
    </>
  )
}
