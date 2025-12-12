"use client"
import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/Container'
import {
    GitHubIcon,
    LinkedInIcon,
    GitLabIcon,
} from '@/components/SocialIcons'
import { type RecommendationInterface } from '@/lib/recommendations'
import portraitImage from '@/images/jonas-petrik-portrait.png'
import recommendations from '@/data/recommendations.json'
import linkedin from '@/data/linkedin.json'

function truncate(text: string, length: number) {
    if (text.length <= length) {
        return text;
    }
    return text.slice(0, length) + '...';
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

function Recommendations() {
    const displayedRecommendations = recommendations.slice(0, 6);

    return (
        <Container className="mt-12 sm:mt-16">
            <div className="text-center">
                <h2 className="text-4xl font-bold text-neutral-800 dark:text-neutral-100">What others say about me</h2>
            </div>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedRecommendations.map((recommendation) => (
                    <Recommendation key={recommendation.slug} recommendation={recommendation} />
                ))}
            </div>
            <div className="text-right mt-6">
                <Link href="/recommendations" className="text-sm font-medium text-neutral-600 transition hover:text-blue-500 dark:text-neutral-400 dark:hover:text-blue-400">
                    {`View all ${recommendations.length} recommendations →`}
                </Link>
            </div>
        </Container>
    )
}

function SocialLink({
    icon: Icon,
    ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
    icon: React.ComponentType<{ className?: string }>
}) {
    return (
        <Link className="group -m-1 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" {...props}>
            <Icon className="h-5 w-5 fill-neutral-500 transition-colors group-hover:fill-blue-500 dark:fill-neutral-400" />
        </Link>
    )
}

function Recommendation({ recommendation }: { recommendation: RecommendationInterface }) {
    return (
        <Link 
            href={`/recommendations#${recommendation.slug}`} 
            className="group block p-5 rounded-lg bg-white/50 dark:bg-neutral-900/50 shadow-sm hover:shadow-md border border-neutral-200/60 dark:border-neutral-700/50 hover:-translate-y-0.5 transition-all duration-200 ease-out"
        >
            <figure>
                <blockquote className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                    <p>&ldquo;{truncate(recommendation.body, 120)}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                    <Image
                        className="h-10 w-10 rounded-full object-cover"
                        width={40}
                        height={40}
                        src={require(`@/images/recommendations/${recommendation.image}`).default}
                        alt={recommendation.fullName}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate">{recommendation.fullName}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{recommendation.position}</div>
                    </div>
                </figcaption>
            </figure>
        </Link>
    )
}

export default function Home() {
    return (
        <>
            <Container className="mt-10 sm:mt-16">
                <div className="flex flex-col md:flex-row gap-10 items-center">
                    <div className="flex-shrink-0 max-w-[200px] lg:max-w-[220px]">
                        <Image
                            src={portraitImage}
                            alt="Jonas Petrik"
                            sizes="(min-width: 1024px) 32rem, 20rem"
                            className="aspect-square rotate-3 rounded-2xl object-cover shadow-lg"
                            priority={false}
                        />
                        <div className="mt-5 flex justify-center gap-5">
                            <SocialLink href="mailto:jonas@petrik.dev" icon={MailIcon} aria-label="Email me" />
                            <SocialLink href="https://www.linkedin.com/in/jonas-petrik/" target="_blank" aria-label="Find me on LinkedIn" icon={LinkedInIcon} />
                            <SocialLink href="https://github.com/wukis" target="_blank" aria-label="Find me on GitHub" icon={GitHubIcon} />
                            <SocialLink href="https://gitlab.com/jonas.petrik" target="_blank" aria-label="Find me on GitLab" icon={GitLabIcon} />
                        </div>
                    </div>
                    <div className="flex-1 p-6 sm:p-8 rounded-xl bg-white/40 dark:bg-neutral-800/30 border border-neutral-200/50 dark:border-neutral-700/30">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                            I&apos;m {linkedin.basics.name} - {linkedin.basics.label}
                        </h1>
                        <p className="mt-5 text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {linkedin.basics.summary}
                        </p>
                    </div>
                </div>
            </Container>
            <Recommendations />
        </>
    )
}
