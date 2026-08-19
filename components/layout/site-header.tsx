import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-heading font-medium text-primary">
            Movie Explorer
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Browse
            </Link>
            <Link
              href="/connect"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Connections
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
