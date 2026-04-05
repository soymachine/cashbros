import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CashBros 💸',
  description: 'Shared expense tracker for startup co-founders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0a] text-white font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
