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

function Recommendations() {
  return (
      <div className="mx-auto mt-16 max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">Recommendations</h2>
        </div>
        <div className="mx-auto mt-12 flow-root max-w-2xl lg:mx-0 lg:max-w-none">
          <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
            {recommendations.map((recommendation, recommendationIndex) => (
                <div key={recommendationIndex} className="pt-4 sm:inline-block sm:w-full sm:px-4">
                  <Recommendation recommendation={recommendation} />
                </div>
            ))}
          </div>
        </div>
      </div>
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
        <figure className="rounded p-8 text-sm leading-6 bg-neutral-50/50 dark:bg-neutral-800/25">
          <blockquote>
            <p className="line-clamp-6">{`“${recommendation.body}”`}</p>
          </blockquote>
            <div className="font-light text-xs italic text-right">{recommendation.date}</div>

          <figcaption className="mt-6 flex items-center gap-x-4">
            <Image
                className="h-18 w-18 rounded"
                width={40}
                height={40}
                src={require(`@/images/photos/${recommendation.image}`).default}
                alt={recommendation.fullName}
            />
            <div>
              <div className="font-semibold">{recommendation.fullName}</div>
              <div className="font-light line-clamp-1">{recommendation.position}</div>
            </div>
          </figcaption>

        </figure>
  )
}

export default async function Home() {
  return (
    <>
      <Container className="mt-9">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 max-w-xs px-2.5 lg:max-w-52 items-center">
            <Image
                src={portraitImage}
                alt=""
                sizes="(min-width: 1024px) 32rem, 20rem"
                className="aspect-square rotate-3 rounded-2xl object-cover"
            />
            <div className="mt-4 flex gap-6">
                <SocialLink href="https://www.linkedin.com/in/jonas-petrik/" target="_blank" aria-label="Find me on LinkedIn" icon={LinkedInIcon} />
                <SocialLink href="https://github.com/wukis" target="_blank" aria-label="Find me on GitHub" icon={GitHubIcon} />
            </div>
          </div>
          <div className="p-8 flex-1 bg-neutral-50/50 dark:bg-neutral-800/25">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
              { linkedin.basics.label }
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
