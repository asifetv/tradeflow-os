"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, LogOut, User } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"

export function TopNav() {
  const router = useRouter()
  const { user, company, clearAuth } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Handle hydration - ensure component mounts on client before reading auth state
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    clearAuth()
    router.push("/auth/login")
  }

  return (
    <div className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Home button */}
          <Link href="/" className="inline-block">
            <Button variant="ghost" size="icon" className="hover:bg-slate-100" title="Home">
              <Home className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>

          {/* Right side - User info and logout */}
          {mounted && user && company && (
            <div className="flex items-center gap-3">
              {/* Company and User Info */}
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                <p className="text-xs text-slate-500">{company.company_name}</p>
              </div>

              {/* User Avatar/Icon */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <User className="h-5 w-5" />
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
