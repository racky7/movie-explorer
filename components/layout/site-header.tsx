import Link from 'next/link'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr'

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-heading text-base font-medium">
          Movie Explorer
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <MagnifyingGlassIcon className="size-4" />
          Browse
        </Link>
      </div>
    </header>
  )
}
