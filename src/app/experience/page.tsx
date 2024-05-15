import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import {Card} from "@/components/Card";
import {EducationInterface, WorkInterface} from "@/lib/experience";
import linkedIn from "@/data/linkedin.json";

export const metadata: Metadata = {
    title: 'Experience',
    description: 'My experience and education.',
}

function Education({ education }: { education: EducationInterface }) {
    return (
        <article className="md:grid md:grid-cols-4 md:items-baseline">
            <Card className="md:col-span-3">
                <Card.Title>
                    {education.area} - {education.institution}
                </Card.Title>
                <Card.Eyebrow
                    as="time"
                    dateTime={education.startDate}
                    className="md:hidden"
                    decorate
                >
                    {`${education.startDate} - ${education.endDate}`}
                </Card.Eyebrow>
                <Card.Description>{education.studyType}</Card.Description>
            </Card>
            <Card.Eyebrow
                as="time"
                dateTime={education.startDate}
                className="mt-1 hidden md:block"
            >
                {`${education.startDate} - ${education.endDate}`}
            </Card.Eyebrow>
        </article>
    )
}

function Work({ workExperience }: { workExperience: WorkInterface }) {
    return (
        <article className="md:grid md:grid-cols-4 md:items-baseline">
            <Card className="md:col-span-3">
                <Card.Title>
                    <div>{workExperience.position}</div>
                    <div><a href={workExperience.url} target="_blank">@{workExperience.name}</a></div>
                    <div>{workExperience.location}</div>
                </Card.Title>
                <Card.Eyebrow
                    as="time"
                    dateTime={workExperience.startDate}
                    className="md:hidden"
                    decorate
                >
                    {`${workExperience.startDate} - ${workExperience.endDate}`}
                </Card.Eyebrow>
                <Card.Summary>{workExperience.summary}</Card.Summary>
            </Card>
            <Card.Eyebrow
                as="time"
                dateTime={workExperience.startDate}
                className="mt-1 hidden md:block"
            >
                {`${workExperience.startDate} - ${workExperience.endDate}`}
            </Card.Eyebrow>
        </article>
    )
}


export default function Experience() {
    return (
        <div>
            <Container className="mt-10">
                <h2 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
                    My experience
                </h2>

                <div className="flex max-w-3xl flex-col space-y-16">
                    {linkedIn.work.map((workExperience: WorkInterface) => (
                        <Work workExperience={workExperience} />
                    ))}
                </div>


            </Container>

            <Container className="mt-10">
                <h2 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
                    My education
                </h2>

                <div className="flex max-w-3xl flex-col space-y-16">
                    {linkedIn.education.map((education: EducationInterface) => (
                        <Education education={education} />
                    ))}
                </div>

            </Container>
        </div>

    )
}
