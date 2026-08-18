import type { Metadata } from 'next'
import { Geist, Geist_Mono, Public_Sans } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/layout/site-header'
import { cn } from '@/lib/utils'
import { TRPCReactProvider } from '@/trpc/provider'

const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-sans' })

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Movie Explorer',
    template: '%s · Movie Explorer',
  },
  description: 'Browse movies, people, and genres.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        publicSans.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <TRPCReactProvider>
          <SiteHeader />
          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
            {children}
          </main>
        </TRPCReactProvider>
      </body>
    </html>
  )
}
