import '@/styles/tailwind.css'

import { type Metadata } from 'next'

import Providers from '@/app/providers'
import DesktopAmbientGate from '@/components/DesktopAmbientGate'
import { Layout } from '@/components/Layout'
import { profileContent } from '@/lib/profileContent'
import { seoDescription, seoKeywords, siteUrl } from '@/lib/siteProfile'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: `%s | ${profileContent.person.name}`,
    default: `${profileContent.person.name} - ${profileContent.person.label}`,
  },
  description: seoDescription,
  keywords: seoKeywords,
  authors: [{ name: profileContent.person.name, url: siteUrl }],
  creator: profileContent.person.name,
  publisher: profileContent.person.name,
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
    siteName: profileContent.person.name,
    title: `${profileContent.person.name} - ${profileContent.person.label}`,
    description: seoDescription,
    images: [
      {
        url: '/jonas-petrik-portrait.png',
        width: 800,
        height: 800,
        alt: profileContent.person.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${profileContent.person.name} - ${profileContent.person.label}`,
    description: seoDescription,
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
      <body className="flex h-full bg-neutral-50 dark:bg-black print:bg-white">
        <div className="print:hidden">
          <DesktopAmbientGate />
        </div>
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
