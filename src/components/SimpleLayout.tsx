import { Container } from '@/components/Container'

export function SimpleLayout({
  title,
  intro,
  children,
}: {
  title: string
  intro?: string
  children?: React.ReactNode
}) {
  return (
    <Container className="mt-10 sm:mt-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-800 sm:text-5xl dark:text-neutral-100">
          {title}
        </h1>
        <p className="mt-6 text-base text-neutral-600 dark:text-neutral-400">
          {intro}
        </p>
      </header>
      {children && <div className="mt-10 sm:mt-12">{children}</div>}
    </Container>
  )
}
