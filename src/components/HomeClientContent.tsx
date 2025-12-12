'use client'

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

function SocialLink({
    icon: Icon,
    label,
    ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
    icon: React.ComponentType<{ className?: string }>
    label: string
}) {
    return (
        <Link 
            className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-sm font-mono text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100" 
            {...props}
        >
            <Icon className="h-4 w-4 fill-neutral-500 transition-colors group-hover:fill-sky-500 dark:fill-neutral-400" />
            <span>{label}</span>
        </Link>
    )
}

function Recommendations() {
    const displayedRecommendations = recommendations.slice(0, 6);

    return (
        <Container className="mt-16 sm:mt-24">
            <div className="mb-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                    <span className="font-mono text-violet-600 dark:text-violet-400">&gt;</span> cat <span className="text-neutral-400 dark:text-neutral-500">testimonials.md</span>
                </h2>
                <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400 font-mono">
                    <span className="text-neutral-400 dark:text-neutral-500"># </span>
                    What colleagues say about working with me
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedRecommendations.map((recommendation, index) => (
                    <Recommendation key={recommendation.slug} recommendation={recommendation} index={index} />
                ))}
            </div>
            
            <div className="mt-8 flex justify-end">
                <Link 
                    href="/recommendations" 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/10 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400 font-mono text-sm hover:bg-violet-500/20 dark:hover:bg-violet-400/20 transition-colors"
                >
                    <span>view all {recommendations.length}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </div>
        </Container>
    )
}

function Recommendation({ recommendation, index }: { recommendation: RecommendationInterface; index: number }) {
    const colors = [
        { border: 'border-emerald-500/30 dark:border-emerald-400/30', hover: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/50', quote: 'text-emerald-600 dark:text-emerald-400' },
        { border: 'border-sky-500/30 dark:border-sky-400/30', hover: 'hover:border-sky-500/50 dark:hover:border-sky-400/50', quote: 'text-sky-600 dark:text-sky-400' },
        { border: 'border-violet-500/30 dark:border-violet-400/30', hover: 'hover:border-violet-500/50 dark:hover:border-violet-400/50', quote: 'text-violet-600 dark:text-violet-400' },
        { border: 'border-amber-500/30 dark:border-amber-400/30', hover: 'hover:border-amber-500/50 dark:hover:border-amber-400/50', quote: 'text-amber-600 dark:text-amber-400' },
        { border: 'border-rose-500/30 dark:border-rose-400/30', hover: 'hover:border-rose-500/50 dark:hover:border-rose-400/50', quote: 'text-rose-600 dark:text-rose-400' },
        { border: 'border-cyan-500/30 dark:border-cyan-400/30', hover: 'hover:border-cyan-500/50 dark:hover:border-cyan-400/50', quote: 'text-cyan-600 dark:text-cyan-400' },
    ];
    const color = colors[index % colors.length];
    
    return (
        <Link 
            href={`/recommendations#${recommendation.slug}`} 
            className={`group block rounded-lg bg-white/50 dark:bg-neutral-900/50 border ${color.border} ${color.hover} overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}
        >
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 h-6 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 truncate">
                    ~/testimonials/{recommendation.slug}
                </span>
            </div>
            
            <div className="p-4">
                <figure>
                    <blockquote className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                        <span className={`${color.quote} text-lg font-serif`}>&ldquo;</span>
                        {truncate(recommendation.body, 120)}
                        <span className={`${color.quote} text-lg font-serif`}>&rdquo;</span>
                    </blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                        <Image
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-neutral-800"
                            width={40}
                            height={40}
                            src={require(`@/images/recommendations/${recommendation.image}`).default}
                            alt={recommendation.fullName}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate">{recommendation.fullName}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate font-mono">{recommendation.position}</div>
                        </div>
                    </figcaption>
                </figure>
            </div>
        </Link>
    )
}

// Skills section
function Skills() {
    const skillCategories = [
        { name: 'Languages', items: ['PHP', 'JavaScript', 'TypeScript', 'Go', 'SQL'], icon: '💻' },
        { name: 'Frameworks', items: ['Laravel', 'React', 'Vue.js', 'Next.js'], icon: '🛠️' },
        { name: 'Infrastructure', items: ['AWS', 'Docker', 'MySQL', 'Redis'], icon: '☁️' },
        { name: 'Practices', items: ['Architecture', 'Team Lead', 'DevOps', 'Agile'], icon: '📋' },
    ];
    
    return (
        <Container className="mt-16 sm:mt-24">
            <div className="mb-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                    <span className="font-mono text-sky-600 dark:text-sky-400">&gt;</span> ls <span className="text-neutral-400 dark:text-neutral-500">-la skills/</span>
                </h2>
                <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400 font-mono">
                    <span className="text-neutral-400 dark:text-neutral-500"># </span>
                    Technologies and expertise
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {skillCategories.map((category) => (
                    <div 
                        key={category.name}
                        className="rounded-lg bg-white/50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/50 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-4 h-6 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
                            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                                {category.icon} {category.name.toLowerCase()}/
                            </span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">{category.name}</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {category.items.map((skill) => (
                                    <span 
                                        key={skill}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Container>
    )
}

export default function HomeClientContent() {
    return (
        <>
            <Container className="mt-10 sm:mt-16">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Left column - Portrait & Socials */}
                    <div className="flex-shrink-0 w-full md:w-auto">
                        <div className="max-w-[200px] lg:max-w-[220px] mx-auto md:mx-0">
                            {/* Terminal card for portrait */}
                            <div className="rounded-lg overflow-hidden border border-neutral-200/60 dark:border-neutral-700/50 bg-white/50 dark:bg-neutral-900/50">
                                <div className="flex items-center gap-2 px-3 h-6 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
                                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                                        ~/profile.png
                                    </span>
                                </div>
                                <div className="p-2">
                                    <Image
                                        src={portraitImage}
                                        alt="Jonas Petrik - Senior Software Engineer Team Lead"
                                        sizes="(min-width: 1024px) 32rem, 20rem"
                                        className="aspect-square rounded-lg object-cover"
                                        priority={true}
                                    />
                                </div>
                            </div>
                            
                            {/* Social links */}
                            <div className="mt-4 space-y-2">
                                <SocialLink href="mailto:jonas@petrik.dev" icon={MailIcon} aria-label="Send email" label="jonas@petrik.dev" />
                                <SocialLink href="https://www.linkedin.com/in/jonas-petrik/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" icon={LinkedInIcon} label="linkedin" />
                                <SocialLink href="https://github.com/wukis" target="_blank" rel="noopener noreferrer" aria-label="GitHub" icon={GitHubIcon} label="github" />
                                <SocialLink href="https://gitlab.com/jonas.petrik" target="_blank" rel="noopener noreferrer" aria-label="GitLab" icon={GitLabIcon} label="gitlab" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Right column - Bio */}
                    <div className="flex-1 min-w-0">
                        {/* Terminal card for bio */}
                        <div className="rounded-lg overflow-hidden border border-emerald-500/30 dark:border-emerald-400/30 bg-white/50 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
                                <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                    ~/README.md
                                </span>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    available
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        {linkedin.basics.label}
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">&gt;</span> {linkedin.basics.name}
                                </h1>
                                <div className="mt-6 prose prose-neutral dark:prose-invert max-w-none">
                                    <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        {linkedin.basics.summary}
                                    </p>
                                </div>
                                
                                {/* Quick links */}
                                <div className="mt-6 flex flex-wrap gap-2">
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
                                        href="/about"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        about me
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
            
            <Skills />
            <Recommendations />
        </>
    )
}
