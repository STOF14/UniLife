import type { CSSProperties } from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { StoreProvider } from '@/hooks/useStore'

const rootFontVariables: CSSProperties = {
  ['--font-display' as string]: 'Newsreader, Iowan Old Style, Times New Roman, serif',
  ['--font-sans' as string]: 'Manrope, Avenir Next, Helvetica Neue, Helvetica, Arial, sans-serif',
  ['--font-mono' as string]: 'JetBrains Mono, SF Mono, Monaco, Consolas, monospace',
}

export const metadata: Metadata = {
  title: 'UniLife',
  description: 'University Life Management',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F0EDE6',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" style={rootFontVariables}>
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}