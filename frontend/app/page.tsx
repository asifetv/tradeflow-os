"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, Users, FileText, ShoppingCart, Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCustomers } from "@/lib/hooks/use-customers"
import { useDeals } from "@/lib/hooks/use-deals"
import { useQuotes } from "@/lib/hooks/use-quotes"
import { useCustomerPos } from "@/lib/hooks/use-customer-pos"
import { useVendors } from "@/lib/hooks/use-vendors"

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/auth/login")
      return
    }
    setIsAuthenticated(true)
    setIsLoading(false)
  }, [router])

  // Only fetch data if authenticated
  const { data: customersData } = useCustomers(
    isAuthenticated ? 0 : undefined,
    isAuthenticated ? 50 : undefined
  )
  const { data: dealsData } = useDeals(
    isAuthenticated ? 0 : undefined,
    isAuthenticated ? 50 : undefined
  )
  const { data: quotesData } = useQuotes(
    isAuthenticated ? 0 : undefined,
    isAuthenticated ? 50 : undefined
  )
  const { data: posData } = useCustomerPos(
    isAuthenticated ? 0 : undefined,
    isAuthenticated ? 50 : undefined
  )
  const { data: vendorsData } = useVendors(
    isAuthenticated ? 0 : undefined,
    isAuthenticated ? 50 : undefined
  )

  if (isLoading || !isAuthenticated) {
    return null // Will redirect via useEffect
  }

  const stats = [
    {
      label: "Customers",
      value: customersData?.total || 0,
      icon: Users,
      href: "/customers",
      color: "from-blue-500 to-blue-600",
      lightColor: "bg-blue-50",
    },
    {
      label: "Deals",
      value: dealsData?.total || 0,
      icon: BarChart3,
      href: "/deals",
      color: "from-purple-500 to-purple-600",
      lightColor: "bg-purple-50",
    },
    {
      label: "Quotes",
      value: quotesData?.total || 0,
      icon: FileText,
      href: "/quotes",
      color: "from-green-500 to-green-600",
      lightColor: "bg-green-50",
    },
    {
      label: "Purchase Orders",
      value: posData?.total || 0,
      icon: ShoppingCart,
      href: "/customer-pos",
      color: "from-orange-500 to-orange-600",
      lightColor: "bg-orange-50",
    },
    {
      label: "Vendors",
      value: vendorsData?.total || 0,
      icon: Building2,
      href: "/vendors",
      color: "from-red-500 to-red-600",
      lightColor: "bg-red-50",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TradeFlow OS
              </h1>
              <p className="text-slate-500 mt-1">Enterprise Trade & Deal Management</p>
            </div>
            <div className="flex gap-3">
              <Link href="/customers/new">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Customer
                </Button>
              </Link>
              <Link href="/vendors/new">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Vendor
                </Button>
              </Link>
              <Link href="/deals/new">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Deal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Module Overview Cards */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Business Overview</h2>
              <p className="text-slate-500 mt-1">View metrics and manage your modules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              const descriptions: Record<string, string> = {
                "Customers": "Manage customer relationships and details",
                "Deals": "Track and manage business deals",
                "Quotes": "Generate and manage price quotes",
                "Purchase Orders": "Track customer purchase orders",
                "Vendors": "Manage supplier relationships and proposals",
              }

              return (
                <Link key={stat.label} href={stat.href}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-white overflow-hidden">
                    {/* Color accent bar */}
                    <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>

                    <CardContent className="p-5 flex flex-col h-full">
                      {/* Top Section: Count + Icon */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{stat.label}</p>
                          <p className={`text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent leading-tight`}>
                            {stat.value}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.lightColor} group-hover:scale-110 transition-transform shrink-0`}>
                          <Icon className={`h-6 w-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                        </div>
                      </div>

                      {/* Description - flexible growth */}
                      <p className="text-sm text-slate-600 leading-relaxed flex-grow mb-4">
                        {descriptions[stat.label]}
                      </p>

                      {/* Action Footer */}
                      <div className="flex items-center gap-2 text-sm pt-2 border-t border-slate-100 group-hover:translate-x-1 transition-transform">
                        <span className="font-semibold text-slate-700">View All</span>
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/customers/new">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-white overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-lg bg-blue-50 group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-center mb-2">New Customer</h3>
                  <p className="text-sm text-slate-600 text-center flex-grow">Add a new customer</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-blue-600 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                    <span>Create</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/deals/new">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-white overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-lg bg-purple-50 group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-center mb-2">New Deal</h3>
                  <p className="text-sm text-slate-600 text-center flex-grow">Create a business deal</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-purple-600 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                    <span>Create</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/quotes/new">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-white overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-lg bg-green-50 group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-center mb-2">New Quote</h3>
                  <p className="text-sm text-slate-600 text-center flex-grow">Generate a price quote</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-green-600 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                    <span>Create</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/customer-pos/new">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-white overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-lg bg-orange-50 group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-center mb-2">New PO</h3>
                  <p className="text-sm text-slate-600 text-center flex-grow">Track a purchase order</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-orange-600 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                    <span>Create</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/vendors/new">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-white overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-lg bg-red-50 group-hover:scale-110 transition-transform">
                      <Plus className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-center mb-2">New Vendor</h3>
                  <p className="text-sm text-slate-600 text-center flex-grow">Add a new supplier</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-red-600 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                    <span>Create</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-slate-500">
          <p>TradeFlow OS v2.0 • © 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  )
}
