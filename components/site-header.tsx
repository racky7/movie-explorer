'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Browse' },
  { href: '/genres', label: 'Genres' },
  { href: '/connect', label: 'Connections' },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-heading font-medium text-primary">
            Movie Explorer
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = isActivePath(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'underline-offset-4 hover:underline',
                    isActive
                      ? 'text-foreground underline'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
