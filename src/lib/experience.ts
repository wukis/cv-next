export interface WorkInterface {
    name: string;
    position: string;
    enrollment?: string;
    startDate: string;
    endDate: string;
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