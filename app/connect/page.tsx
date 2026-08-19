import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ConnectPage, ConnectPageSkeleton } from './-component/connect-page'

export const metadata: Metadata = {
  title: 'Connections',
  description: 'Find how two people connect through films.',
}

export default function Page() {
  return (
    <Suspense fallback={<ConnectPageSkeleton />}>
      <ConnectPage />
    </Suspense>
  )
}
