'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We couldn&apos;t load this page. This is often temporary — the
            database may be briefly unreachable.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => retry()}>Try again</Button>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
