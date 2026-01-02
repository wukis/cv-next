import { type Metadata } from 'next';
import dynamic from 'next/dynamic';

// Dynamically import the heavy ExperienceClientPage component to improve initial page load
// This ensures the component is code-split and only loaded when needed
const ExperienceClientContent = dynamic(
  () => import('@/components/ExperienceClientPage'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-neutral-600 dark:text-neutral-400 font-mono">Loading experience...</div>
      </div>
    ),
    ssr: true, // Keep SSR for SEO
  }
);

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
