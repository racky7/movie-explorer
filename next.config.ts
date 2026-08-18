import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // neo4j-driver opens raw TLS sockets, so leave it to native `require`
  // instead of letting the Server Components bundler pull it in.
  serverExternalPackages: ['neo4j-driver'],
}

export default nextConfig
