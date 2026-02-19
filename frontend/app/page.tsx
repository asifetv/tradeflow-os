"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { BarChart3, Users, FileText, ShoppingCart, TrendingUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCustomers } from "@/lib/hooks/use-customers"
import { useDeals } from "@/lib/hooks/use-deals"
import { useQuotes } from "@/lib/hooks/use-quotes"
import { useCustomerPos } from "@/lib/hooks/use-customer-po"

export default function DashboardPage() {
  const router = useRouter()
  const { data: customersData } = useCustomers(0, 1)
  const { data: dealsData } = useDeals(0, 1)
  const { data: quotesData } = useQuotes(0, 1)
  const { data: posData } = useCustomerPos(0, 1)

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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-0 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${stat.lightColor}`}>
                        <Icon className={`h-6 w-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                      </div>
                      <TrendingUp className="h-5 w-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Navigation Cards */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Quick Access</h2>
              <p className="text-slate-500 mt-1">Navigate to your key business modules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customers */}
            <Link href="/customers">
              <Card className="h-full hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer group border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      Customers
                    </CardTitle>
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Manage customer relationships and details</CardDescription>
                  <Button variant="ghost" size="sm" className="mt-4 w-full justify-start text-blue-600 hover:text-blue-700">
                    View All →
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Deals */}
            <Link href="/deals">
              <Card className="h-full hover:shadow-lg hover:border-purple-200 transition-all duration-300 cursor-pointer group border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                      Deals
                    </CardTitle>
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Track and manage business deals</CardDescription>
                  <Button variant="ghost" size="sm" className="mt-4 w-full justify-start text-purple-600 hover:text-purple-700">
                    View All →
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Quotes */}
            <Link href="/quotes">
              <Card className="h-full hover:shadow-lg hover:border-green-200 transition-all duration-300 cursor-pointer group border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-green-600 transition-colors">
                      Quotes
                    </CardTitle>
                    <FileText className="h-5 w-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Generate and manage price quotes</CardDescription>
                  <Button variant="ghost" size="sm" className="mt-4 w-full justify-start text-green-600 hover:text-green-700">
                    View All →
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Purchase Orders */}
            <Link href="/customer-pos">
              <Card className="h-full hover:shadow-lg hover:border-orange-200 transition-all duration-300 cursor-pointer group border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                      Purchase Orders
                    </CardTitle>
                    <ShoppingCart className="h-5 w-5 text-orange-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>Track customer purchase orders</CardDescription>
                  <Button variant="ghost" size="sm" className="mt-4 w-full justify-start text-orange-600 hover:text-orange-700">
                    View All →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/customers/new">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-slate-300 hover:bg-blue-50">
                  <Plus className="h-4 w-4" />
                  Create New Customer
                </Button>
              </Link>
              <Link href="/deals/new">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-slate-300 hover:bg-purple-50">
                  <Plus className="h-4 w-4" />
                  Create New Deal
                </Button>
              </Link>
              <Link href="/quotes/new">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-slate-300 hover:bg-green-50">
                  <Plus className="h-4 w-4" />
                  Create New Quote
                </Button>
              </Link>
              <Link href="/customer-pos/new">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 border-slate-300 hover:bg-orange-50">
                  <Plus className="h-4 w-4" />
                  Create New PO
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Real-time Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Track deals, quotes, and customer activity with real-time dashboards
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">🔗</span>
                  Smart Linking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Seamlessly connect customers, deals, quotes, and purchase orders
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  Activity Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Complete audit trail of all changes with timestamps and user info
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  State Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Intelligent workflow automation with status transitions
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">🔐</span>
                  Enterprise Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Type-safe architecture with end-to-end validation
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  Responsive Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Modern Material Design interface that works on all devices
                </p>
              </CardContent>
            </Card>
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
