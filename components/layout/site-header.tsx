import Link from 'next/link'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr'

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-primary font-medium">
          Movie Explorer
        </Link>
      </div>
    </header>
  )
}
