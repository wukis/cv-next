'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button, DownloadIcon } from '@/components/Button'
import {
  CloseIcon,
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
          description="Grab the latest PDF version of my resume."
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
              className="fixed inset-x-4 top-4 z-70 overflow-hidden rounded-sm bg-white shadow-2xl ring-1 ring-neutral-200 md:hidden dark:bg-neutral-950 dark:ring-neutral-800"
            >
              <div className="flex h-6 items-center justify-between border-b border-neutral-200 bg-neutral-50/80 px-4 dark:border-neutral-800 dark:bg-neutral-900">
                <span className="font-mono text-[10px] text-neutral-700 dark:text-neutral-100">
                  ~/download
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close download dialog"
                  className="-mr-2 inline-flex h-6 w-6 items-center justify-center rounded-sm transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  <CloseIcon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                </button>
              </div>

              <div className="p-3">
                <div className="px-4 py-2.5">
                  <h2 className="font-mono text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Grab my CV
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-neutral-600 dark:text-neutral-300">
                    Download the latest PDF version to your device.
                  </p>
                </div>

                <div className="mt-2 flex justify-end gap-2 px-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsOpen(false)}
                    className="min-h-11 rounded-sm border border-neutral-300 bg-neutral-50 px-5 font-mono text-neutral-900 hover:border-emerald-300 hover:text-emerald-800 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 dark:hover:border-emerald-700 dark:hover:text-emerald-200"
                  >
                    Cancel
                  </Button>
                  <a
                    href={CV_PDF_URL}
                    download
                    onClick={() => setIsOpen(false)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-emerald-300 bg-neutral-50 px-5 py-2 font-mono text-sm font-medium whitespace-nowrap text-emerald-900 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-lg active:transition-none dark:border-emerald-800 dark:bg-neutral-900/50 dark:text-emerald-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/70"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    <span>download PDF</span>
                  </a>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
