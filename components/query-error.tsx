'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return "We couldn't load this page. This is often temporary — try again in a moment."
}

export function QueryError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>{errorMessage(error)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  )
}
