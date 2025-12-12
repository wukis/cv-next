import { type Metadata } from 'next'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import {RecommendationInterface} from "@/lib/recommendations";
import recommendations from '@/data/recommendations.json';
import Image from "next/image";

function Recommendation({ recommendation }: { recommendation: RecommendationInterface }) {
  return (
    <article id={recommendation.slug} className="md:grid md:grid-cols-4 md:items-start gap-4">
      <Card className="md:col-span-3">
        <div className="flex items-center gap-4">
          <Image
            className="h-12 w-12 rounded-full object-cover flex-shrink-0"
            width={48}
            height={48}
            src={require(`@/images/recommendations/${recommendation.image}`).default}
            alt={recommendation.fullName}
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{recommendation.fullName}</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">{recommendation.position}</p>
          </div>
        </div>
        <Card.Eyebrow
          as="time"
          dateTime={recommendation.date}
          className="md:hidden mt-3"
          decorate
        >
          {recommendation.date}
        </Card.Eyebrow>
        <Card.Description>
          <p className="leading-relaxed">{recommendation.body}</p>
        </Card.Description>
      </Card>
      <Card.Eyebrow
        as="time"
        dateTime={recommendation.date}
        className="mt-1 hidden md:block pl-4 text-neutral-500"
      >
        {recommendation.date}
      </Card.Eyebrow>
    </article>
  )
}

export const metadata: Metadata = {
  title: 'Recommendations',
  description:
    'Recommendations that I\'ve received throughout my carrier.',
}

export default async function ArticlesIndex() {
  return (
    <SimpleLayout
      title="Recommendations that I've received throughout my career."
    >
      <div className="md:border-l md:border-neutral-200 md:pl-8 md:dark:border-neutral-700/50">
        <div className="max-w-4xl space-y-6">
          {recommendations.map((recommendation: RecommendationInterface) => (
            <Recommendation key={recommendation.slug} recommendation={recommendation} />
          ))}
        </div>
      </div>
    </SimpleLayout>
  )
}
