import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import linkedin from '@/data/linkedin.json'

import '@/styles/tailwind.css'
import ParticlesBackground from "@/components/ParticlesBackground";

export const metadata: Metadata = {
  title: {
    template: '%s | ' + linkedin.basics.name,
    default:
    linkedin.basics.name + ' - ' + linkedin.basics.label,
  },
  description: linkedin.basics.summary,
  alternates: {
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
    },
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
        <ParticlesBackground />
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
