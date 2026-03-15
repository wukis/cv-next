import {
  curatedHomepageRecommendationSlugs,
  getHomepageRecommendations,
  profileContent,
  sortRecommendationsForDefaultView,
} from '@/lib/profileContent'

export {
  curatedHomepageRecommendationSlugs,
  getHomepageRecommendations,
  sortRecommendationsForDefaultView,
}

export const siteUrl = profileContent.site.url
export const publicEmail = profileContent.site.email
export const seoDescription = profileContent.seo.description
export const seoKeywords = profileContent.seo.keywords
export const personKnowsAbout = profileContent.expertise.keywords
export const heroIntro = profileContent.narratives.heroIntro
export const homeImpactCards = profileContent.highlights.homeImpactCards
export const selectedImpactStories = profileContent.highlights.selectedImpactStories
export const aboutNarrative = profileContent.narratives.aboutNarrative
export const publicWork = profileContent.work
export const currentPublicRole = profileContent.currentRole
export const totalPublicExperienceYears = profileContent.experienceYears
export const allRecommendations = profileContent.recommendations
export const publicProfileLinks = profileContent.links
export const cvSummary = profileContent.person.summary
export const publicLocationSummary = profileContent.person.locationSummary
export const publicBasics = {
  name: profileContent.person.name,
  label: profileContent.person.label,
  email: profileContent.person.email,
  url: profileContent.person.website,
  location: profileContent.person.location,
}
