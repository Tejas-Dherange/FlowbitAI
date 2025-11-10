"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, FolderOpen, Building2, Users, Settings, MessageCircle } from "lucide-react"
import Image from "next/image"

export function Sidebar() {
  const pathname = usePathname()

  const items = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chat With Data", icon: MessageCircle },
    { href: "/invoice", label: "Invoice", icon: FileText },
    { href: "/other-files", label: "Other files", icon: FolderOpen },
    { href: "/departments", label: "Departments", icon: Building2 },
    { href: "/users", label: "Users", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="w-[220px] bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-900 font-semibold text-sm">Buchhaltung</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-10">12 members</p>
      </div>

      {/* Navigation */}
      <div className="px-3 py-4">
        <p className="px-3 text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">GENERAL</p>
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-bold">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Flowbit AI Logo */}
      <div className="absolute bottom-6 left-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex items-center justify-center">
            <Image
              src="/flowbit.png"
              alt="Flowbit Logo"
              width={16}
              height={16}
            />
          </div>
          <span className="text-lg font-semibold text-gray-900">Flowbit AI</span>
        </div>
      </div>
    </div>
  )
}
