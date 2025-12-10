import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/supabase/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UniLife - Academic Management Platform',
  description: 'Personal academic management and planning tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

// /home/stof/unilife/lib/supabase/providers.tsx