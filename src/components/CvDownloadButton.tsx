'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button, DownloadIcon } from '@/components/Button'
import {
  DesktopTooltip,
  headerControlClassName,
} from '@/components/HeaderShared'

const CV_PDF_URL = '/jonas-petrik-cv.pdf'

export default function CvDownloadButton() {
  const panelId = useId()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const { style: htmlStyle } = document.documentElement
    const { style: bodyStyle } = document.body
    const previousHtmlOverflow = htmlStyle.overflow
    const previousBodyOverflow = bodyStyle.overflow

    htmlStyle.overflow = 'hidden'
    bodyStyle.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      htmlStyle.overflow = previousHtmlOverflow
      bodyStyle.overflow = previousBodyOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <>
      <div className="hidden md:block">
        <DesktopTooltip
          label="Download CV"
          description="Save the latest PDF version of the resume."
          align="right"
        >
          <a
            href={CV_PDF_URL}
            download
            aria-label="Download CV PDF"
            className={`${headerControlClassName} h-11 w-11`}
          >
            <DownloadIcon className="h-5 w-5 text-neutral-700 transition group-hover:text-emerald-800 dark:text-neutral-200 dark:group-hover:text-emerald-200" />
          </a>
        </DesktopTooltip>
      </div>

      <button
        type="button"
        aria-label="Open CV download options"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen(true)}
        className={`${headerControlClassName} h-11 w-11 md:hidden`}
      >
        <DownloadIcon className="h-5 w-5 text-neutral-700 transition dark:text-neutral-200" />
      </button>

      {isOpen &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-60 bg-neutral-900/60 backdrop-blur-xs md:hidden"
              onClick={() => setIsOpen(false)}
              aria-label="Close CV download dialog"
            />
            <div
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Download CV"
              className="fixed inset-x-4 top-20 z-70 rounded-2xl border border-neutral-200/80 bg-white/95 p-4 shadow-2xl ring-1 ring-neutral-200/70 backdrop-blur-md md:hidden dark:border-neutral-700 dark:bg-neutral-900/95 dark:ring-neutral-700/70"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                  <DownloadIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-emerald-700 uppercase dark:text-emerald-300">
                    Download CV
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Save the latest PDF resume
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    This downloads the latest CV as a PDF to your device, so you
                    can open it locally or share it later.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsOpen(false)}
                  className="min-h-11 flex-1"
                >
                  Cancel
                </Button>
                <a
                  href={CV_PDF_URL}
                  download
                  onClick={() => setIsOpen(false)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-neutral-800 px-3 py-2 text-sm font-semibold text-neutral-100 outline-offset-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-neutral-700 hover:shadow-lg active:bg-neutral-800 active:text-neutral-100/70 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:active:bg-neutral-700 dark:active:text-neutral-100/70"
                >
                  Download PDF
                </a>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
