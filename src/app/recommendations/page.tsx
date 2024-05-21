import { type Metadata } from 'next'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import {RecommendationInterface} from "@/lib/recommendations";
import recommendations from '@/data/recommendations.json';
import Image from "next/image";

function Recommendation({ recommendation }: { recommendation: RecommendationInterface }) {
  return (
    <article id={recommendation.slug} className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title>
          <div className="flex items-center gap-x-4">
            <Image
                className="h-18 w-18 rounded"
                width={40}
                height={40}
                src={require(`@/images/recommendations/${recommendation.image}`).default}
                alt={recommendation.fullName}
            />
            <div>
              <div className="font-semibold">{recommendation.fullName}</div>
              <div className="font-light line-clamp-1">{recommendation.position}</div>
            </div>
          </div>
        </Card.Title>
        <Card.Eyebrow
          as="time"
          dateTime={recommendation.date}
          className="md:hidden"
          decorate
        >
          {recommendation.date}
        </Card.Eyebrow>
        <Card.Description>{recommendation.body}</Card.Description>
      </Card>
      <Card.Eyebrow
        as="time"
        dateTime={recommendation.date}
        className="mt-1 hidden md:block"
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
      title="Recommendations that I've received throughout my carrier."
    >
      <div className="md:border-l md:border-neutral-300 md:pl-6 md:dark:border-neutral-300/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {/*{recommendations.map((recommendation: RecommendationInterface) => (*/}
          {/*  <Recommendation key={recommendation.slug} recommendation={recommendation} />*/}
          {/*))}*/}
        </div>
      </div>
    </SimpleLayout>
  )
}
