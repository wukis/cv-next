import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/Container'
import {
  GitHubIcon,
  LinkedInIcon,
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
        <Container className="mt-16">
            <div className="text-center">
                <h2 className="text-4xl font-bold text-neutral-800 dark:text-neutral-100">What others say about me</h2>
            </div>
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedRecommendations.map((recommendation) => (
                    <Recommendation key={recommendation.slug} recommendation={recommendation} />
                ))}
            </div>
            <div className="text-right mt-4">
                <Link href="/recommendations" className="text-neutral-600 hover:text-neutral-800 rounded px-3 py-2 text-sm font-medium hover:shadow-lg hover:bg-neutral-100/75 dark:hover:bg-neutral-200/50">
                    {`Show All (${recommendations.length})`}
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
    <Link className="group -m-1 p-1" {...props}>
      <Icon className="h-6 w-6 fill-neutral-500 transition group-hover:fill-neutral-600 dark:fill-neutral-400 dark:group-hover:fill-neutral-300" />
    </Link>
  )
}

function Recommendation({ recommendation }: { recommendation: RecommendationInterface }) {
  return (
          <Link href={`/recommendations#${recommendation.slug}`} className="block p-4 rounded hover:bg-neutral-100/75 hover:dark:bg-neutral-800/50 shadow hover:shadow-lg transition-transform transform hover:scale-105">
              <figure>
                  <blockquote className="text-sm line-clamp-2">
                      <p>{`“${truncate(recommendation.body, 100)}”`}</p>
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-4">
                      {/*<Image*/}
                      {/*    className="h-10 w-10 rounded"*/}
                      {/*    width={40}*/}
                      {/*    height={40}*/}
                      {/*    src={require(`@/images/recommendations/${recommendation.image}`)}*/}
                      {/*    alt={recommendation.fullName}*/}
                      {/*/>*/}
                      <div>
                          <div className="font-semibold">{recommendation.fullName}</div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400">{recommendation.position}</div>
                          <div className="text-xs italic text-right">{recommendation.date}</div>
                      </div>
                  </figcaption>
              </figure>
          </Link>
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
