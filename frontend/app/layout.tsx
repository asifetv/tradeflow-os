import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeFlow OS',
  description: 'Production-grade oil & gas trading platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  )
}
