import React from "react";
import { type Metadata } from 'next'

import { Container } from '@/components/Container'
import { Card } from "@/components/Card";
import { EducationInterface, WorkInterface } from "@/lib/experience";
import linkedIn from "@/data/linkedin.json";
import work from "@/data/work.json";
import Image from "next/image";

export const metadata: Metadata = {
    title: 'Experience',
    description: 'My experience and education.',
}

const groupWorkExperiences = (workExperiences: WorkInterface[]) => {
    return workExperiences.reduce((acc, experience) => {
        const { name } = experience;
        if (!acc[name]) {
            acc[name] = {
                company: name,
                url: experience.url,
                location: experience.location,
                image: experience.image,
                experiences: [],
            };
        }
        acc[name].experiences.push(experience);
        return acc;
    }, {} as Record<string, { company: string, url: string, location: string, image: string, experiences: WorkInterface[] }>);
};

const groupedWorkExperiences = groupWorkExperiences(work);

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

function Work({ groupedWorkExperiences }: { groupedWorkExperiences: Record<string, { company: string, url: string, location: string, image: string, experiences: WorkInterface[] }> }) {
    return (
        <div>
            {Object.keys(groupedWorkExperiences).map(company => {
                const companyData = groupedWorkExperiences[company];
                return (
                    <article key={company} className="md:grid md:grid-cols-4 md:items-baseline">
                        <Card className="md:col-span-3">
                            <Card.Eyebrow
                                as="time"
                                dateTime={companyData.experiences[0].startDate}
                                className="md:hidden"
                                decorate
                            >
                                {`${companyData.experiences[0].startDate} - ${companyData.experiences[companyData.experiences.length - 1].endDate}`}
                            </Card.Eyebrow>
                            <Card.Description>
                                <div className="flex items-start space-x-4 mb-8">
                                    <Image
                                        className="w-12 h-12 rounded"
                                        width={50}
                                        height={50}
                                        src={require(`@/images/companies/${companyData.image}`).default}
                                        alt={companyData.company}
                                    />
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            {companyData.company}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {companyData.location}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {companyData.experiences.map((experience, index) => (
                                        <div key={index} className="mb-4">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                <h3 className="text-base font-semibold">
                                                    {experience.position}
                                                </h3>
                                            </div>
                                            <div className="pl-4">
                                                <p className="text-sm text-gray-600">
                                                    {new Date(experience.startDate).toLocaleDateString()} - {experience.endDate === "now" ? "Present" : new Date(experience.endDate).toLocaleDateString()}
                                                </p>
                                                {experience.summary && (
                                                    <p className="text-sm text-gray-600">
                                                        {experience.summary.split('\n').map((line, i) => (
                                                            <React.Fragment key={i}>
                                                                {line}
                                                                <br />
                                                            </React.Fragment>
                                                        ))}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                    ))}
                                </div>
                            </Card.Description>
                        </Card>
                        <Card.Eyebrow
                            as="time"
                            dateTime={companyData.experiences[0].startDate}
                            className="mt-1 hidden md:block"
                        >
                            {`${companyData.experiences[0].startDate} - ${companyData.experiences[companyData.experiences.length - 1].endDate}`}
                        </Card.Eyebrow>
                    </article>
                );
            })}
        </div>
    );
}

export default function Experience() {
    return (
        <div>
            <Container className="mt-10">
                <h2 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
                    My experience
                </h2>

                <div className="flex max-w-3xl flex-col space-y-16">
                    <Work groupedWorkExperiences={groupedWorkExperiences} />
                </div>
            </Container>

            <Container className="mt-10">
                <h2 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
                    My education
                </h2>

                <div className="flex max-w-3xl flex-col space-y-16">
                    {linkedIn.education.map((education: EducationInterface) => (
                        <Education key={education.institution} education={education} />
                    ))}
                </div>
            </Container>
        </div>
    )
}
