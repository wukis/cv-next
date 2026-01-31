export interface WorkInterface {
    name: string;
    position: string;
    enrollment?: string;
    startDate: string;
    endDate: string;
    highlights: string[];
    responsibilities: string[];
    projects: string[];
    technologies: string[];
    url: string;
    location?: string;
    image: string;
}


export interface EducationInterface {
    institution: string
    area: string
    studyType: string
    startDate: string
    endDate: string
}

// Calculate duration between two dates
export const getDuration = (startDate: string, endDate: string): { years: number, months: number } => {
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

// Group work experiences by company
export const groupWorkExperiences = (workExperiences: WorkInterface[]) => {
    return workExperiences.reduce((acc, experience) => {
        const { name, startDate, endDate } = experience;
        if (!acc[name]) {
            acc[name] = {
                company: name,
                totalDuration: { years: 0, months: 0 },
            };
        }

        const experienceDuration = getDuration(startDate, endDate);
        acc[name].totalDuration.years += experienceDuration.years;
        acc[name].totalDuration.months += experienceDuration.months;

        if (acc[name].totalDuration.months >= 12) {
            acc[name].totalDuration.years += Math.floor(acc[name].totalDuration.months / 12);
            acc[name].totalDuration.months = acc[name].totalDuration.months % 12;
        }

        return acc;
    }, {} as Record<string, {
        company: string,
        totalDuration: { years: number, months: number },
    }>);
};

// Calculate total years of experience from grouped work experiences
export const calculateTotalExperienceYears = (workExperiences: WorkInterface[]): number => {
    const grouped = groupWorkExperiences(workExperiences);
    const total = Object.values(grouped).reduce((acc, { totalDuration }) => {
        acc.years += totalDuration.years;
        acc.months += totalDuration.months;
        return acc;
    }, { years: 0, months: 0 });
    
    return total.years + Math.floor(total.months / 12);
};