import React from "react";
import { type Metadata } from 'next';

import { Container } from '@/components/Container';
import { Card } from "@/components/Card";
import { EducationInterface, WorkInterface } from "@/lib/experience";
import linkedIn from "@/data/linkedin.json";
import work from "@/data/work.json";
import Image from "next/image";

export const metadata: Metadata = {
    title: 'Experience',
    description: 'My experience and education.',
};

// const getDuration = (startDate: string, endDate: string): { years: number, months: number } => {
//     const start = new Date(startDate);
//     const end = endDate === "now" ? new Date() : new Date(endDate);
//
//     let years = end.getFullYear() - start.getFullYear();
//     let months = end.getMonth() - start.getMonth() + 1;
//
//     if (months >= 12) {
//         years += 1;
//         months -= 12;
//     } else if (months < 0) {
//         years -= 1;
//         months += 12;
//     }
//
//     return { years, months };
// };
//
// const formatDuration = (duration: { years: number, months: number }): string => {
//     const { years, months } = duration;
//     let formatted = '';
//     if (years > 0) {
//         formatted += `${years} year${years !== 1 ? 's' : ''}`;
//     }
//     if (months > 0) {
//         if (formatted) formatted += ' ';
//         formatted += `${months} month${months !== 1 ? 's' : ''}`;
//     }
//     return formatted || '0 months';
// };
//
// const getCompanyDuration = (experiences: WorkInterface[]) => {
//     const startDates = experiences.map(exp => new Date(exp.startDate).getTime());
//     const endDates = experiences.map(exp => exp.endDate === "now" ? new Date().getTime() : new Date(exp.endDate).getTime());
//
//     const earliestStartDate = new Date(Math.min(...startDates));
//     const latestEndDate = new Date(Math.max(...endDates));
//
//     return {
//         startDate: earliestStartDate,
//         endDate: latestEndDate,
//     };
// };
//
// const groupWorkExperiences = (workExperiences: WorkInterface[]) => {
//     return workExperiences.reduce((acc, experience) => {
//         const { name, startDate, endDate } = experience;
//         if (!acc[name]) {
//             acc[name] = {
//                 company: name,
//                 url: experience.url,
//                 location: experience.location ?? '',
//                 image: experience.image,
//                 experiences: [],
//                 totalDuration: { years: 0, months: 0 },
//                 startDate: new Date(startDate),
//                 endDate: endDate === "now" ? new Date() : new Date(endDate),
//             };
//         }
//         acc[name].experiences.push(experience);
//
//         const experienceDuration = getDuration(startDate, endDate);
//         acc[name].totalDuration.years += experienceDuration.years;
//         acc[name].totalDuration.months += experienceDuration.months;
//
//         if (acc[name].totalDuration.months >= 12) {
//             acc[name].totalDuration.years += Math.floor(acc[name].totalDuration.months / 12);
//             acc[name].totalDuration.months = acc[name].totalDuration.months % 12;
//         }
//
//         const companyDuration = getCompanyDuration(acc[name].experiences);
//         acc[name].startDate = companyDuration.startDate;
//         acc[name].endDate = companyDuration.endDate;
//
//         return acc;
//     }, {} as Record<string, {
//         company: string,
//         url: string,
//         location: string,
//         image: string,
//         experiences: WorkInterface[],
//         totalDuration: { years: number, months: number },
//         startDate: Date,
//         endDate: Date
//     }>);
// };
//
// const calculateTotalExperience = (groupedWorkExperiences: Record<string, { totalDuration: { years: number, months: number } }>) => {
//     return Object.values(groupedWorkExperiences).reduce((acc, { totalDuration }) => {
//         acc.years += totalDuration.years;
//         acc.months += totalDuration.months;
//         return acc;
//     }, { years: 0, months: 0 });
// };
//
// const groupedWorkExperiences = groupWorkExperiences(work as WorkInterface[]);
// const totalExperience = calculateTotalExperience(groupedWorkExperiences);
// const totalExperienceYears = totalExperience.years + Math.floor(totalExperience.months / 12);
//
// function Education({ education }: { education: EducationInterface }) {
//     return (
//         <article className="md:grid md:grid-cols-4 md:items-baseline">
//             <Card className="md:col-span-3">
//                 <Card.Title>
//                     <div className="flex items-start space-x-4 mb-8">
//                         <Image
//                             className="w-12 h-12 rounded"
//                             width={50}
//                             height={50}
//                             src={require(`@/images/universities/vilniaus-universitetas.png`).default}
//                             alt={education.institution}
//                         />
//                         <div>
//                             <h2 className="text-lg font-semibold">
//                                 {education.studyType} in {education.area}
//                             </h2>
//                             <div>
//                                 {education.institution}
//                             </div>
//                         </div>
//                     </div>
//                 </Card.Title>
//                 <Card.Eyebrow
//                     as="time"
//                     dateTime={education.startDate}
//                     className="md:hidden"
//                     decorate
//                 >
//                     {`${education.startDate} - ${education.endDate}`}
//                 </Card.Eyebrow>
//             </Card>
//             <Card.Eyebrow
//                 as="time"
//                 dateTime={education.startDate}
//                 className="mt-1 hidden md:block"
//             >
//                 {`${education.startDate} - ${education.endDate}`}
//             </Card.Eyebrow>
//         </article>
//     );
// }
//
// function Work({ groupedWorkExperiences }: { groupedWorkExperiences: Record<string, { company: string, url: string, location: string, image: string, experiences: WorkInterface[], totalDuration: { years: number, months: number }, startDate: Date, endDate: Date }> }) {
//     return (
//         <div>
//             {Object.keys(groupedWorkExperiences).map(company => {
//                 const companyData = groupedWorkExperiences[company];
//                 const formattedStartDate = `${companyData.startDate.getFullYear()}-${String(companyData.startDate.getMonth() + 1).padStart(2, '0')}`;
//                 const formattedEndDate = `${companyData.endDate.getFullYear()}-${String(companyData.endDate.getMonth() + 1).padStart(2, '0')}`;
//                 return (
//                     <article key={company} className="md:grid md:grid-cols-4 md:items-baseline">
//                         <Card className="md:col-span-3">
//                             <Card.Eyebrow
//                                 as="time"
//                                 dateTime={formattedStartDate}
//                                 className="md:hidden"
//                                 decorate
//                             >
//                                 {`${formattedStartDate} - ${formattedEndDate}`}
//                             </Card.Eyebrow>
//                             <Card.Description>
//                                 <div className="flex items-start space-x-4 mb-8">
//                                     <Image
//                                         className="w-12 h-12 rounded"
//                                         width={50}
//                                         height={50}
//                                         src={require(`@/images/companies/${companyData.image}`).default}
//                                         alt={companyData.company}
//                                     />
//                                     <div>
//                                         <h2 className="text-lg font-semibold">
//                                             {companyData.company} - Full-time
//                                         </h2>
//                                         <p className="text-sm text-gray-600">
//                                             <span className="text-sm text-gray-600">({formatDuration(companyData.totalDuration)})</span> {companyData.location}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="mt-4">
//                                     {companyData.experiences.map((experience, index) => (
//                                         <div key={index} className="mb-4">
//                                             <div className="flex items-center space-x-2">
//                                                 <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
//                                                 <h3 className="text-base font-semibold">
//                                                     {experience.position} <span className="text-sm text-gray-600">({formatDuration(getDuration(experience.startDate, experience.endDate))})</span>
//                                                 </h3>
//                                             </div>
//                                             <div className="pl-4">
//                                                 {experience.summary && (
//                                                     <p className="text-sm text-neutral-600 dark:text-neutral-300">
//                                                         {experience.summary.split('\n').map((line, i) => (
//                                                             <React.Fragment key={i}>
//                                                                 {line}
//                                                                 <br />
//                                                             </React.Fragment>
//                                                         ))}
//                                                     </p>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </Card.Description>
//                         </Card>
//                         <Card.Eyebrow
//                             as="time"
//                             dateTime={formattedStartDate}
//                             className="mt-1 hidden md:block"
//                         >
//                             {`${formattedStartDate} - ${formattedEndDate}`}
//                         </Card.Eyebrow>
//                     </article>
//                 );
//             })}
//         </div>
//     );
// }

export default function Experience() {
    return (
        <div>
            {/*<Container className="mt-10">*/}
            {/*    <h2 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">*/}
            {/*        My {totalExperienceYears}+ years experience*/}
            {/*    </h2>*/}

            {/*    <div className="flex max-w-3xl flex-col space-y-16">*/}
            {/*        <Work groupedWorkExperiences={groupedWorkExperiences} />*/}
            {/*    </div>*/}
            {/*</Container>*/}

            <Container className="mt-10">
                <h2 className="text-4xl mb-4 font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
                    My education
                </h2>

                {/*<div className="flex max-w-3xl flex-col space-y-16">*/}
                {/*    {linkedIn.education.map((education: EducationInterface) => (*/}
                {/*        <Education key={education.institution} education={education} />*/}
                {/*    ))}*/}
                {/*</div>*/}
            </Container>
        </div>
    );
}
