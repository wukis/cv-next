'use client'

import { useEffect } from 'react'

export function ConsoleEasterEgg() {
  useEffect(() => {
    // Only run once on mount
    const asciiArt = `
%c
     ██╗ ██████╗ ███╗   ██╗ █████╗ ███████╗
     ██║██╔═══██╗████╗  ██║██╔══██╗██╔════╝
     ██║██║   ██║██╔██╗ ██║███████║███████╗
██   ██║██║   ██║██║╚██╗██║██╔══██║╚════██║
╚█████╔╝╚██████╔╝██║ ╚████║██║  ██║███████║
 ╚════╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝
`

    const welcomeMessage = `
%c┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  👋 Hey there, fellow developer!                            │
│                                                             │
│  Since you're poking around in the console, you're          │
│  clearly my kind of person.                                 │
│                                                             │
│  Quick facts:                                               │
│  • Yes, this site is built with Next.js & React             │
│  • No, I didn't use a template (much)                       │
│  • The hexagon animation? Pure CSS sorcery                  │
│    + requestAnimationFrame                                  │
│  • I handle €6.5B+ in checkout transactions at work         │
│    but I still console.log() to debug sometimes... 🤫       │
│                                                             │
│  10+ years of experience and I still google                 │
│  "how to center a div" occasionally.                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘`

    const funCommands = `
%c> Available commands (just kidding, this isn't actually a terminal):

  hire jonas    - Send me an email 📧
  jonas.skills  - ["PHP", "Go", "JS", "Making things work at 3 AM"]
  jonas.debug() - console.log("It works on my machine ™")

%c💡 Pro tip: If you're here to inspect my code quality,
   just know the production code at SCAYLE is %cmuch%c cleaner.
   This is my personal playground. 

   Want to chat? → jonas@petrik.dev
`

    const joke = `
%c
// TODO: Remove before deploying to production
// FIXME: This has been here since 2013
// HACK: Don't ask
// NOTE: If you're reading this, you owe me a coffee ☕
`

    // Log everything with styling
    console.log(asciiArt, 'color: #0ea5e9; font-weight: bold; font-size: 10px;')
    
    console.log(welcomeMessage, 'color: #94a3b8; font-family: monospace; font-size: 12px; line-height: 1.4;')
    
    console.log(
      funCommands, 
      'color: #22c55e; font-family: monospace;',
      'color: #94a3b8; font-family: monospace;',
      'color: #f59e0b; font-weight: bold;',
      'color: #94a3b8; font-family: monospace;'
    )
    
    console.log(joke, 'color: #6b7280; font-style: italic; font-size: 11px;')

    // Easter egg: define a global function
    if (typeof window !== 'undefined') {
      // @ts-expect-error - Adding global easter egg
      window.jonas = {
        skills: ['PHP', 'Laravel', 'Go', 'JavaScript', 'React', 'Vue', 'MySQL', 'AWS', 'Making deadlines somehow'],
        yearsOfExperience: new Date().getFullYear() - 2013,
        currentMood: () => {
          const moods = [
            '☕ Caffeinated and dangerous',
            '🐛 Hunting bugs',
            '📝 Writing TODO comments I\'ll never fix',
            '🤔 Wondering why it works',
            '😎 In the zone',
            '🔥 Everything is fine (it\'s not)',
          ]
          return moods[Math.floor(Math.random() * moods.length)]
        },
        debug: () => {
          console.log('%c✨ It works on my machine ™', 'color: #22c55e; font-size: 14px;')
          return '🔧 Classic debugging technique activated.'
        },
        hire: () => {
          console.log('%c📧 Opening email...', 'color: #0ea5e9;')
          window.open('mailto:jonas@petrik.dev?subject=Found your Easter egg!', '_blank')
          return '✉️ Email client opened! Looking forward to hearing from you.'
        },
        whoami: () => {
          console.log('%cJonas Petrik - Staff Engineer / Team Lead @ SCAYLE\nFrom Lithuania 🇱🇹, based in Germany 🇩🇪\nBuilding things that handle billions.', 'color: #e879f9;')
          return 'Jonas Petrik - Staff Engineer / Team Lead'
        },
      }
      
      console.log('%c💡 Try: jonas.skills, jonas.currentMood(), jonas.debug(), jonas.hire(), or jonas.whoami()', 'color: #a78bfa; font-size: 11px;')
    }
  }, [])

  return null
}

