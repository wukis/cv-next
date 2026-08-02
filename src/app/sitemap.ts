import { MetadataRoute } from 'next'

const canonicalPages = [
  { path: '', priority: 1 },
  { path: '/about', priority: 0.8 },
  { path: '/experience', priority: 0.8 },
  { path: '/cv', priority: 0.8 },
  { path: '/recommendations', priority: 0.7 },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://petrik.dev'

  return canonicalPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: page.priority,
  }))
}
