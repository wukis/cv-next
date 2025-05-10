import { type Metadata } from 'next';
import ExperienceClientContent from '@/components/ExperienceClientPage';

// 'use client'; // Removed this line
// Removed other imports that are now in ExperienceClientPage.tsx

export const metadata: Metadata = {
    title: 'Experience',
    description: 'My experience and education.',
};

export default function ExperiencePage() {
  return <ExperienceClientContent />;
}
