import type { Metadata, Viewport } from 'next'
import './globals.css'
import { StoreProvider } from '@/hooks/useStore' // <--- 1. Import this

export const metadata: Metadata = {
  title: 'UniLife',
  description: 'University Life Management',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* 2. Wrap the children with the Provider */}
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}