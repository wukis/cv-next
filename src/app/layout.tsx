import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import linkedin from '@/data/linkedin.json'

import '@/styles/tailwind.css'
import DeferredBackground from "@/components/DeferredBackground";
import DeferredMetricWidgets from "@/components/DeferredMetricWidgets";
import DeferredLogTerminal from "@/components/DeferredLogTerminal";
import DeferredConsoleEasterEgg from "@/components/DeferredConsoleEasterEgg";

const siteUrl = 'https://petrik.dev'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | ' + linkedin.basics.name,
    default: linkedin.basics.name + ' - ' + linkedin.basics.label,
  },
  description: linkedin.basics.summary,
  keywords: [
    'Jonas Petrik',
    'Senior Software Engineer',
    'Team Lead',
    'PHP Developer',
    'JavaScript Developer',
    'Go Developer',
    'Full Stack Developer',
    'Software Architect',
    'Germany',
    'Lithuania',
  ],
  authors: [{ name: linkedin.basics.name, url: siteUrl }],
  creator: linkedin.basics.name,
  publisher: linkedin.basics.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: linkedin.basics.name,
    title: linkedin.basics.name + ' - ' + linkedin.basics.label,
    description: linkedin.basics.summary,
    images: [
      {
        url: '/jonas-petrik-portrait.png',
        width: 800,
        height: 800,
        alt: linkedin.basics.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: linkedin.basics.name + ' - ' + linkedin.basics.label,
    description: linkedin.basics.summary,
    images: ['/jonas-petrik-portrait.png'],
    creator: '@jonaspetrik',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here if you have one
    // google: 'your-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-neutral-50 dark:bg-black">
        <DeferredConsoleEasterEgg />
        <DeferredBackground />
        <DeferredMetricWidgets />
        <DeferredLogTerminal />
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
