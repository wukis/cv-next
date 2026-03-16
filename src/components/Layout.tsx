import BackToTopButton from '@/components/BackToTopButton'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="relative flex w-full flex-col">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-auto">{children}</main>
        <div className="print:hidden">
          <Footer />
        </div>
      </div>
      <div className="print:hidden">
        <BackToTopButton />
      </div>
    </>
  )
}
