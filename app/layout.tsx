import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "FlowbitAI - Dashboard",
  description: "Invoice Analytics Dashboard",
  icons: {
    icon: '/flowbit.png',
    apple: '/flowbit.png'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <Sidebar />
        <main className="ml-[220px] min-h-screen">{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
