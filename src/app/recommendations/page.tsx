import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { RecommendationInterface } from "@/lib/recommendations";
import recommendations from '@/data/recommendations.json';
import Image from "next/image";

const colors = [
  { border: 'border-emerald-500/30 dark:border-emerald-400/30', ring: 'ring-emerald-500/30 dark:ring-emerald-400/30', dot: 'bg-emerald-500 dark:bg-emerald-400', quote: 'text-emerald-600 dark:text-emerald-400' },
  { border: 'border-sky-500/30 dark:border-sky-400/30', ring: 'ring-sky-500/30 dark:ring-sky-400/30', dot: 'bg-sky-500 dark:bg-sky-400', quote: 'text-sky-600 dark:text-sky-400' },
  { border: 'border-violet-500/30 dark:border-violet-400/30', ring: 'ring-violet-500/30 dark:ring-violet-400/30', dot: 'bg-violet-500 dark:bg-violet-400', quote: 'text-violet-600 dark:text-violet-400' },
  { border: 'border-amber-500/30 dark:border-amber-400/30', ring: 'ring-amber-500/30 dark:ring-amber-400/30', dot: 'bg-amber-500 dark:bg-amber-400', quote: 'text-amber-600 dark:text-amber-400' },
  { border: 'border-rose-500/30 dark:border-rose-400/30', ring: 'ring-rose-500/30 dark:ring-rose-400/30', dot: 'bg-rose-500 dark:bg-rose-400', quote: 'text-rose-600 dark:text-rose-400' },
  { border: 'border-cyan-500/30 dark:border-cyan-400/30', ring: 'ring-cyan-500/30 dark:ring-cyan-400/30', dot: 'bg-cyan-500 dark:bg-cyan-400', quote: 'text-cyan-600 dark:text-cyan-400' },
];

function Recommendation({ recommendation, index }: { recommendation: RecommendationInterface; index: number }) {
  const color = colors[index % colors.length];
  
  return (
    <article id={recommendation.slug} className="relative flex gap-4 sm:gap-6 pb-8 sm:pb-10 group scroll-mt-20">
      {/* Timeline column - hidden on mobile */}
      <div className="relative hidden sm:flex flex-col items-center">
        {/* Vertical line */}
        <div className="absolute top-6 bottom-0 w-px bg-neutral-300 dark:bg-neutral-600" />

        {/* Commit node */}
        <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
          <div className={`absolute inset-0 rounded-full ring-4 ${color.ring}`} />
          <div className={`relative w-4 h-4 rounded-full ${color.dot} ring-2 ring-white dark:ring-neutral-900`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 sm:-mt-1">
        {/* Terminal-style card */}
        <div className={`rounded-lg border bg-white/50 dark:bg-neutral-900/50 overflow-hidden transition-all duration-300 ${color.border} group-hover:shadow-lg`}>
          {/* Terminal header - date only on mobile, full path on desktop */}
          <div className="flex items-center justify-between gap-2 px-4 py-2 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
            <span className="hidden sm:block text-xs font-mono text-neutral-600 dark:text-neutral-300 truncate">
              ~/testimonials/{recommendation.slug}.md
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono text-neutral-600 dark:text-neutral-300 bg-neutral-200/50 dark:bg-neutral-700/50 sm:ml-auto">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {recommendation.date}
            </div>
          </div>
          
          {/* Card content */}
          <div className="p-5">
            {/* Author info */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <Image
                className="h-12 w-12 rounded-lg object-cover ring-2 ring-white dark:ring-neutral-800 flex-shrink-0"
                width={48}
                height={48}
                src={require(`@/images/recommendations/${recommendation.image}`).default}
                alt={recommendation.fullName}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base text-neutral-800 dark:text-neutral-100">{recommendation.fullName}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono truncate">{recommendation.position}</p>
              </div>
            </div>
            
            {/* Quote */}
            <blockquote className="relative">
              <span className={`absolute -top-2 -left-1 text-4xl font-serif ${color.quote} opacity-30`}>&ldquo;</span>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed pl-4">
                {recommendation.body}
              </p>
              <span className={`text-4xl font-serif ${color.quote} opacity-30`}>&rdquo;</span>
            </blockquote>
          </div>
        </div>
      </div>
    </article>
  )
}

export const metadata: Metadata = {
  title: 'Recommendations',
  description:
    'Professional recommendations and testimonials for Jonas Petrik from colleagues and industry peers.',
  alternates: {
    canonical: '/recommendations',
  },
}

export default async function RecommendationsPage() {
  return (
    <Container className="mt-10 sm:mt-16">
      {/* Page header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-mono text-neutral-600 dark:text-neutral-400 mb-4">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          {recommendations.length} testimonials
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
          <span className="font-mono text-violet-600 dark:text-violet-400">&gt;</span> cat <span className="text-neutral-500 dark:text-neutral-400">testimonials/*.md</span>
        </h1>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400 font-mono">
          <span className="text-neutral-500 dark:text-neutral-400"># </span>
          Recommendations from colleagues throughout my career
        </p>
      </div>

      {/* Recommendations list */}
      <div className="max-w-3xl">
        {recommendations.map((recommendation: RecommendationInterface, index: number) => (
          <Recommendation key={recommendation.slug} recommendation={recommendation} index={index} />
        ))}
        
        {/* End marker - hidden on mobile */}
        <div className="relative hidden sm:flex items-center gap-6">
          <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-600 ring-2 ring-white dark:ring-neutral-900" />
          </div>
          <span className="text-sm font-mono text-neutral-500 dark:text-neutral-400">
            EOF
          </span>
        </div>
      </div>
    </Container>
  )
}
