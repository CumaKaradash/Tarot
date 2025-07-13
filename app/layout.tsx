import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cuma Karadash',
  description: 'Created with Cuma Karadash',
  generator: 'Cuma Karadash',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
