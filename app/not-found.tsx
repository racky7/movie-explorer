import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-medium">Not found</h1>
      <p className="text-sm text-muted-foreground">
        That movie, person, or genre is not in the catalog.
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Back to movies
      </Button>
    </div>
  )
}
