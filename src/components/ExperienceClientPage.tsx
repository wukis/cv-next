'use client';
import React from "react";
import { type Metadata } from 'next';

import { Container } from '@/components/Container';
import { Card } from "@/components/Card";
import { EducationInterface, WorkInterface } from "@/lib/experience";
import linkedIn from "@/data/linkedin.json";
import work from "@/data/work.json";
import Image from "next/image";

// Metadata export will be removed from here, as it's moved to the server component page.tsx
// export const metadata: Metadata = {
//     title: 'Experience',
//     description: 'My experience and education.',
// };

const getDuration = (startDate: string, endDate: string): { years: number, months: number } => {
    const start = new Date(startDate);
    const end = endDate === "now" ? new Date() : new Date(endDate);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth() + 1;

    if (months >= 12) {
        years += 1;
        months -= 12;
    } else if (months < 0) {
        years -= 1;
        months += 12;
    }

    return { years, months };
};

const formatDuration = (duration: { years: number, months: number }): string => {
    const { years, months } = duration;
    let formatted = '';
    if (years > 0) {
        formatted += `${years} year${years !== 1 ? 's' : ''}`;
    }
    if (months > 0) {
        if (formatted) formatted += ' ';
        formatted += `${months} month${months !== 1 ? 's' : ''}`;
    }
    return formatted || '0 months';
};

const getCompanyDuration = (experiences: WorkInterface[]) => {
    const startDates = experiences.map(exp => new Date(exp.startDate).getTime());
    const endDates = experiences.map(exp => exp.endDate === "now" ? new Date().getTime() : new Date(exp.endDate).getTime());

    const earliestStartDate = new Date(Math.min(...startDates));
    const latestEndDate = new Date(Math.max(...endDates));

    return {
        startDate: earliestStartDate,
        endDate: latestEndDate,
    };
};

const groupWorkExperiences = (workExperiences: WorkInterface[]) => {
    return workExperiences.reduce((acc, experience) => {
        const { name, startDate, endDate } = experience;
        if (!acc[name]) {
            acc[name] = {
                company: name,
                url: experience.url,
                location: experience.location ?? '',
                image: experience.image,
                experiences: [],
                totalDuration: { years: 0, months: 0 },
                startDate: new Date(startDate),
                endDate: endDate === "now" ? new Date() : new Date(endDate),
            };
        }
        acc[name].experiences.push(experience);

        const experienceDuration = getDuration(startDate, endDate);
        acc[name].totalDuration.years += experienceDuration.years;
        acc[name].totalDuration.months += experienceDuration.months;

        if (acc[name].totalDuration.months >= 12) {
            acc[name].totalDuration.years += Math.floor(acc[name].totalDuration.months / 12);
            acc[name].totalDuration.months = acc[name].totalDuration.months % 12;
        }

        const companyDuration = getCompanyDuration(acc[name].experiences);
        acc[name].startDate = companyDuration.startDate;
        acc[name].endDate = companyDuration.endDate;

        return acc;
    }, {} as Record<string, {
        company: string,
        url: string,
        location: string,
        image: string,
        experiences: WorkInterface[],
        totalDuration: { years: number, months: number },
        startDate: Date,
        endDate: Date
    }>);
};

const calculateTotalExperience = (groupedWorkExperiences: Record<string, { totalDuration: { years: number, months: number } }>) => {
    return Object.values(groupedWorkExperiences).reduce((acc, { totalDuration }) => {
        acc.years += totalDuration.years;
        acc.months += totalDuration.months;
        return acc;
    }, { years: 0, months: 0 });
};

const groupedWorkExperiences = groupWorkExperiences(work as WorkInterface[]);
const totalExperience = calculateTotalExperience(groupedWorkExperiences);
const totalExperienceYears = totalExperience.years + Math.floor(totalExperience.months / 12);

function Education({ education }: { education: EducationInterface }) {
    return (
        <article className="md:grid md:grid-cols-4 md:items-start gap-4 py-3">
            <Card className="md:col-span-3 w-full">
                <Card.Eyebrow
                    as="time"
                    dateTime={education.startDate}
                    className="md:hidden"
                    decorate
                >
                    {`${education.startDate} - ${education.endDate}`}
                </Card.Eyebrow>
                <div className="flex w-full items-start gap-4">
                    <Image
                        className="h-12 w-12 rounded-lg object-contain flex-shrink-0 bg-white p-1"
                        width={48}
                        height={48}
                        src={require(`@/images/universities/vilniaus-universitetas.png`).default}
                        alt={education.institution}
                    />
                    <div className="flex-1 min-w-0">
                        <Card.Title>
                            {education.studyType} in {education.area}
                        </Card.Title>
                        <Card.Description>
                            <p>{education.institution}</p>
                        </Card.Description>
                    </div>
                </div>
            </Card>
            <Card.Eyebrow
                as="time"
                dateTime={education.startDate}
                className="mt-1 hidden md:block md:text-left pl-4 text-neutral-500"
            >
                {`${education.startDate} - ${education.endDate}`}
            </Card.Eyebrow>
        </article>
    );
}

function Work({ groupedWorkExperiences }: { groupedWorkExperiences: Record<string, { company: string, url: string, location: string, image: string, experiences: WorkInterface[], totalDuration: { years: number, months: number }, startDate: Date, endDate: Date }> }) {
    return (
        <div className="space-y-4">
            {Object.keys(groupedWorkExperiences).map(company => {
                const companyData = groupedWorkExperiences[company];
                const formattedStartDate = `${companyData.startDate.getFullYear()}-${String(companyData.startDate.getMonth() + 1).padStart(2, '0')}`;
                const formattedEndDate = `${companyData.endDate.getFullYear()}-${String(companyData.endDate.getMonth() + 1).padStart(2, '0')}`;
                return (
                    <article key={company} className="md:grid md:grid-cols-4 md:items-start gap-4">
                        <Card className="md:col-span-3 w-full">
                            <Card.Eyebrow
                                as="time"
                                dateTime={formattedStartDate}
                                className="md:hidden"
                                decorate
                            >
                                {`${formattedStartDate} - ${formattedEndDate}`}
                            </Card.Eyebrow>
                            
                            <div className="flex w-full items-start gap-4">
                                <Image
                                    className="h-12 w-12 rounded-lg object-contain flex-shrink-0 bg-white p-1"
                                    width={48}
                                    height={48}
                                    src={require(`@/images/companies/${companyData.image}`).default}
                                    alt={companyData.company}
                                />
                                <div className="flex-1 min-w-0">
                                    <Card.Title>
                                        {companyData.url ? (
                                            <a href={companyData.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                                                {companyData.company}
                                            </a>
                                        ) : companyData.company}
                                    </Card.Title>
                                    <Card.Description>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                            {formatDuration(companyData.totalDuration)} · {companyData.location}
                                        </p>
                                    </Card.Description>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4 pl-16">
                                {companyData.experiences.map((experience, index) => (
                                    <div key={index} className="relative before:absolute before:-left-4 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-neutral-300 dark:before:bg-neutral-600">
                                        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                                            {experience.position}
                                            <span className="ml-2 text-xs font-normal text-neutral-500 dark:text-neutral-400">
                                                ({formatDuration(getDuration(experience.startDate, experience.endDate))})
                                            </span>
                                        </h3>
                                        {experience.summary && (
                                            <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-relaxed">
                                                {experience.summary}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <Card.Eyebrow
                            as="time"
                            dateTime={formattedStartDate}
                            className="mt-1 hidden md:block md:text-left pl-4 text-neutral-500"
                        >
                            {`${formattedStartDate} - ${formattedEndDate}`}
                        </Card.Eyebrow>
                    </article>
                );
            })}
        </div>
    );
}

export default function ExperienceClientContent() {
    return (
        <div>
            <Container className="mt-10 sm:mt-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                    My {totalExperienceYears}+ years experience
                </h2>

                <div className="mt-8 max-w-4xl">
                    <Work groupedWorkExperiences={groupedWorkExperiences} />
                </div>
            </Container>

            <Container className="mt-12 sm:mt-20">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                    My education
                </h2>

                <div className="mt-8 max-w-4xl">
                    {linkedIn.education.map((education: EducationInterface) => (
                        <Education key={education.institution} education={education} />
                    ))}
                </div>
            </Container>
        </div>
    );
} 