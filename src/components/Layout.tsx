'use client'

import { useEffect, useState } from 'react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 400px
      if (window.scrollY > 400) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`
        fixed bottom-6 z-40
        right-4 sm:right-8 lg:right-[max(2rem,calc((100vw-80rem)/2+5rem))]
        flex items-center justify-center
        w-10 h-10 rounded-lg
        bg-white/80 dark:bg-neutral-800/80
        shadow-lg shadow-neutral-800/5
        ring-1 ring-neutral-200/50 dark:ring-neutral-700/50
        backdrop-blur
        transition-all duration-300
        hover:ring-emerald-500/50 dark:hover:ring-emerald-400/50
        hover:shadow-emerald-500/10
        ${isVisible 
          ? 'opacity-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
    >
      <svg 
        className="w-5 h-5 text-emerald-500 dark:text-emerald-400" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 10l7-7m0 0l7 7m-7-7v18" 
        />
      </svg>
    </button>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="relative flex w-full flex-col">
        <Header />
        <main className="flex-auto">{children}</main>
        <Footer />
      </div>
      <BackToTopButton />
    </>
  )
}
