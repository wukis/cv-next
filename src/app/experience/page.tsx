import { type Metadata } from 'next';
import ExperienceClientContent from '@/components/ExperienceClientPage';

// 'use client'; // Removed this line
// Removed other imports that are now in ExperienceClientPage.tsx

export const metadata: Metadata = {
    title: 'Experience',
    description: 'Professional experience and education of Jonas Petrik - Senior Software Engineer and Team Lead with expertise in PHP, JavaScript, Go, and software architecture.',
    alternates: {
        canonical: '/experience',
    },
};

export default function ExperiencePage() {
  return <ExperienceClientContent />;
}
