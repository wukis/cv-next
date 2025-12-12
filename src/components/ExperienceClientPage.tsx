'use client';
import React from "react";

import { Container } from '@/components/Container';
import { EducationInterface, WorkInterface } from "@/lib/experience";
import linkedIn from "@/data/linkedin.json";
import work from "@/data/work.json";
import Image from "next/image";

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
        formatted += `${years}y`;
    }
    if (months > 0) {
        if (formatted) formatted += ' ';
        formatted += `${months}m`;
    }
    return formatted || '0m';
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

// Get role type for branch coloring
const getRoleType = (position: string): 'lead' | 'senior' | 'mid' | 'junior' => {
    const lower = position.toLowerCase();
    if (lower.includes('lead') || lower.includes('manager') || lower.includes('head')) return 'lead';
    if (lower.includes('senior')) return 'senior';
    if (lower.includes('junior') || lower.includes('intern')) return 'junior';
    return 'mid';
};

const getBranchColors = (roleType: 'lead' | 'senior' | 'mid' | 'junior') => {
    switch (roleType) {
        case 'lead':
            return {
                node: 'bg-emerald-500 dark:bg-emerald-400',
                ring: 'ring-emerald-500/30 dark:ring-emerald-400/30',
                glow: 'shadow-emerald-500/40 dark:shadow-emerald-400/40',
                ping: 'bg-emerald-500/40 dark:bg-emerald-400/40',
                border: 'border-emerald-500/40 dark:border-emerald-400/40',
                text: 'text-emerald-600 dark:text-emerald-400',
                bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
            };
        case 'senior':
            return {
                node: 'bg-sky-500 dark:bg-sky-400',
                ring: 'ring-sky-500/30 dark:ring-sky-400/30',
                glow: 'shadow-sky-500/40 dark:shadow-sky-400/40',
                ping: 'bg-sky-500/40 dark:bg-sky-400/40',
                border: 'border-sky-500/40 dark:border-sky-400/40',
                text: 'text-sky-600 dark:text-sky-400',
                bg: 'bg-sky-500/10 dark:bg-sky-400/10',
            };
        case 'mid':
            return {
                node: 'bg-violet-500 dark:bg-violet-400',
                ring: 'ring-violet-500/30 dark:ring-violet-400/30',
                glow: 'shadow-violet-500/40 dark:shadow-violet-400/40',
                ping: 'bg-violet-500/40 dark:bg-violet-400/40',
                border: 'border-violet-500/40 dark:border-violet-400/40',
                text: 'text-violet-600 dark:text-violet-400',
                bg: 'bg-violet-500/10 dark:bg-violet-400/10',
            };
        case 'junior':
            return {
                node: 'bg-amber-500 dark:bg-amber-400',
                ring: 'ring-amber-500/30 dark:ring-amber-400/30',
                glow: 'shadow-amber-500/40 dark:shadow-amber-400/40',
                ping: 'bg-amber-500/40 dark:bg-amber-400/40',
                border: 'border-amber-500/40 dark:border-amber-400/40',
                text: 'text-amber-600 dark:text-amber-400',
                bg: 'bg-amber-500/10 dark:bg-amber-400/10',
            };
    }
};

function Education({ education, isLast }: { education: EducationInterface; isLast: boolean }) {
    return (
        <div className="relative flex gap-6 pb-8 group">
            {/* Timeline column */}
            <div className="relative flex flex-col items-center">
                {/* Vertical line */}
                {!isLast && (
                    <div className="absolute top-6 bottom-0 w-px bg-gradient-to-b from-amber-500/60 to-amber-500/20 dark:from-amber-400/60 dark:to-amber-400/20" />
                )}
                
                {/* Commit node - restored style with outer glow ring */}
                <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full ring-4 ring-amber-500/30 dark:ring-amber-400/30 shadow-lg shadow-amber-500/40 dark:shadow-amber-400/40" />
                    {/* Inner commit node */}
                    <div className="relative w-4 h-4 rounded-full bg-amber-500 dark:bg-amber-400 ring-2 ring-white dark:ring-neutral-900" />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Terminal-style card */}
                <div className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/50 bg-white/50 dark:bg-neutral-900/50 overflow-hidden transition-all duration-300 group-hover:border-amber-500/40 dark:group-hover:border-amber-400/40 group-hover:shadow-lg group-hover:shadow-amber-500/5">
                    {/* Terminal header - h-6 matches commit node height for alignment */}
                    <div className="flex items-center gap-2 px-4 h-6 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
                        <span className="ml-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                            ~/education/{education.studyType.toLowerCase().replace(/\s+/g, '-')}
                        </span>
                    </div>
                    
                    {/* Card content */}
                    <div className="p-4">
                        <div className="flex items-start gap-4">
                            <Image
                                className="h-12 w-12 rounded-lg object-contain flex-shrink-0 bg-white p-1 ring-1 ring-neutral-200 dark:ring-neutral-700"
                                width={48}
                                height={48}
                                src={require(`@/images/universities/vilniaus-universitetas.png`).default}
                                alt={education.institution}
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                                    {education.studyType} in {education.area}
                                </h3>
                                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                    {education.institution}
                                </p>
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {education.startDate} → {education.endDate}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Work({ groupedWorkExperiences }: { groupedWorkExperiences: Record<string, { company: string, url: string, location: string, image: string, experiences: WorkInterface[], totalDuration: { years: number, months: number }, startDate: Date, endDate: Date }> }) {
    const companies = Object.keys(groupedWorkExperiences);
    
    return (
        <div className="relative">
            {companies.map((company, companyIndex) => {
                const companyData = groupedWorkExperiences[company];
                const formattedStartDate = `${companyData.startDate.getFullYear()}-${String(companyData.startDate.getMonth() + 1).padStart(2, '0')}`;
                const formattedEndDate = `${companyData.endDate.getFullYear()}-${String(companyData.endDate.getMonth() + 1).padStart(2, '0')}`;
                const isFirst = companyIndex === 0;
                const isLast = companyIndex === companies.length - 1;
                
                // Determine primary role type from the most senior position
                const primaryRole = companyData.experiences.reduce((acc, exp) => {
                    const type = getRoleType(exp.position);
                    if (type === 'lead') return 'lead';
                    if (type === 'senior' && acc !== 'lead') return 'senior';
                    if (type === 'mid' && acc !== 'lead' && acc !== 'senior') return 'mid';
                    return acc;
                }, 'junior' as 'lead' | 'senior' | 'mid' | 'junior');
                
                const colors = getBranchColors(primaryRole);
                
                return (
                    <div key={company} className="relative flex gap-6 pb-8 group">
                        {/* Timeline column */}
                        <div className="relative flex flex-col items-center">
                            {/* Vertical line */}
                            {!isLast && (
                                <div className="absolute top-6 bottom-0 w-px bg-neutral-300 dark:bg-neutral-600" />
                            )}
                            
                            {/* Commit node - restored previous style with outer glow ring */}
                            <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
                                {/* Ping animation for current position */}
                                {isFirst && (
                                    <div className={`absolute inset-0 rounded-full ${colors.ping} animate-ping`} />
                                )}
                                {/* Outer glow ring */}
                                <div className={`absolute inset-0 rounded-full ring-4 ${colors.ring} shadow-lg ${colors.glow}`} />
                                {/* Inner commit node */}
                                <div className={`relative w-4 h-4 rounded-full ${colors.node} ring-2 ring-white dark:ring-neutral-900`} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 -mt-1">
                            {/* Terminal-style card */}
                            <div className={`rounded-lg border bg-white/50 dark:bg-neutral-900/50 overflow-hidden transition-all duration-300 ${colors.border} group-hover:shadow-lg`}>
                                {/* Terminal header */}
                                <div className="flex items-center justify-between gap-2 px-4 py-2 bg-neutral-100/80 dark:bg-neutral-800/80 border-b border-neutral-200/60 dark:border-neutral-700/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate">
                                            ~/work/{companyData.company.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
                                        </span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono ${colors.text} ${colors.bg}`}>
                                        {isFirst ? (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                                HEAD
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                {formattedEndDate}
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Company header */}
                                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="flex items-start gap-4">
                                        <Image
                                            className="h-12 w-12 rounded-lg object-contain flex-shrink-0 bg-white p-1 ring-1 ring-neutral-200 dark:ring-neutral-700"
                                            width={48}
                                            height={48}
                                            src={require(`@/images/companies/${companyData.image}`).default}
                                            alt={companyData.company}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                                                {companyData.url ? (
                                                    <a 
                                                        href={companyData.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors inline-flex items-center gap-1"
                                                    >
                                                        {companyData.company}
                                                        <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                ) : companyData.company}
                                            </h3>
                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 dark:text-neutral-400">
                                                <span className="font-mono">{formatDuration(companyData.totalDuration)}</span>
                                                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {companyData.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Positions/Commits list */}
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {companyData.experiences.map((experience, index) => {
                                        const roleType = getRoleType(experience.position);
                                        const roleColors = getBranchColors(roleType);
                                        
                                        return (
                                            <div key={index} className="p-4">
                                                {/* Position header */}
                                                <div className="flex items-start gap-3">
                                                    {/* Mini commit indicator */}
                                                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${roleColors.node}`} />
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="font-medium text-neutral-800 dark:text-neutral-100">
                                                                {experience.position}
                                                            </h4>
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono ${roleColors.text} ${roleColors.bg}`}>
                                                                {formatDuration(getDuration(experience.startDate, experience.endDate))}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Summary with code-like formatting */}
                                                        {experience.summary && (
                                                            <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                                                <pre className="whitespace-pre-wrap font-sans">{experience.summary}</pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function ExperienceClientContent() {
    return (
        <div>
            <Container className="mt-10 sm:mt-16">
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-mono text-neutral-600 dark:text-neutral-400 mb-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        currently employed
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">&gt;</span> git log <span className="text-neutral-400 dark:text-neutral-500">--oneline</span>
                    </h1>
                    <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400 font-mono">
                        <span className="text-neutral-400 dark:text-neutral-500"># </span>
                        {totalExperienceYears}+ years of professional experience
                    </p>
                </div>

                <div className="max-w-3xl">
                    <Work groupedWorkExperiences={groupedWorkExperiences} />
                </div>
            </Container>

            <Container className="mt-16 sm:mt-24">
                <div className="mb-10">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
                        <span className="font-mono text-amber-600 dark:text-amber-400">&gt;</span> git checkout <span className="text-neutral-400 dark:text-neutral-500">education</span>
                    </h2>
                    <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400 font-mono">
                        <span className="text-neutral-400 dark:text-neutral-500"># </span>
                        Academic background
                    </p>
                </div>

                <div className="max-w-3xl">
                    {linkedIn.education.map((education: EducationInterface, index: number) => (
                        <Education 
                            key={education.institution} 
                            education={education} 
                            isLast={index === linkedIn.education.length - 1}
                        />
                    ))}
                </div>
            </Container>
        </div>
    );
}
