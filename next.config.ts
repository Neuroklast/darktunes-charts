import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  images: {
    remotePatterns: [
      // Spotify CDN for artist/album artwork
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: '*.scdn.co' },
      // Mosaic artwork and other Spotify image hosts
      { protocol: 'https', hostname: 'mosaic.scdn.co' },
      { protocol: 'https', hostname: 'lineup-images.scdn.co' },
      // General HTTPS images (user-supplied cover art URLs stored in DB)
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default withNextIntl(nextConfig)
