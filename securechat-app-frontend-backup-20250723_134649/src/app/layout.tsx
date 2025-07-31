import "./globals.css"
import type { Metadata } from "next"
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SecureChat - Quantum-Safe Messaging",
  description: "Secure messaging with post-quantum cryptography protection",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.className} bg-black text-white min-h-screen`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}