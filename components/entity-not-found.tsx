import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function EntityNotFound({
  message = 'That movie, person, or genre is not in the catalog.',
}: {
  message?: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-medium">Not found</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Back to movies
      </Button>
    </div>
  )
}
