"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { authApi, axiosInstance } from "@/lib/api"
import { useAuth } from "@/lib/hooks/use-auth"

const loginSchema = z.object({
  subdomain: z.string().min(1, "Subdomain is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      subdomain: "",
      email: "",
      password: "",
    },
  })

  // Load stored subdomain after client mount
  useEffect(() => {
    const storedSubdomain = localStorage.getItem("company_subdomain")
    if (storedSubdomain) {
      form.setValue("subdomain", storedSubdomain)
    }
    setMounted(true)
  }, [])

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)
    try {
      const subdomain = values.subdomain.toLowerCase().trim()

      // Set subdomain header for this request
      axiosInstance.defaults.headers.common["X-Subdomain"] = subdomain

      console.log("Login attempt:", { email: values.email, subdomain })

      const response = await authApi.login({
        email: values.email,
        password: values.password,
      })
      console.log("Login response:", response.data)

      const { access_token, user, company } = response.data

      // Store token in localStorage and cookies
      localStorage.setItem("access_token", access_token)
      // Always store the actual company subdomain from the response
      localStorage.setItem("company_subdomain", company.subdomain)
      // Also set cookie for middleware to access
      document.cookie = `access_token=${access_token}; path=/; max-age=86400`

      // Update auth store
      setAuth(user, company, access_token)

      toast.success(`Welcome back, ${user.full_name}!`)
      router.push("/")
    } catch (error: any) {
      console.error("Login error:", error)

      // Detailed error handling
      if (error.response?.status === 401) {
        const detail = error.response?.data?.detail
        if (detail?.includes("company")) {
          toast.error("Company not found. Did you use the correct subdomain?")
        } else {
          toast.error("Invalid email or password. Please check your credentials.")
        }
      } else {
        const message = error.response?.data?.detail || error.message || "Login failed"
        toast.error(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold">Login</CardTitle>
          <CardDescription>Sign in to your TradeFlow OS account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Subdomain</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Input
                          placeholder="acme"
                          {...field}
                          className="rounded-r-none lowercase"
                          autoComplete="off"
                        />
                        <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                          .tradeflow.com
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@company.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <a href="/auth/register" className="text-blue-600 hover:underline font-semibold">
                  Register
                </a>
              </p>
            </form>
          </Form>

          {/* Test Credentials Info */}
          <div className="mt-6 pt-6 border-t bg-blue-50 p-3 rounded-md text-xs text-gray-600">
            <p className="font-semibold mb-2">Test Credentials:</p>
            <p>Subdomain: demo</p>
            <p>Email: admin@acme.com</p>
            <p>Password: password123</p>
            <p className="mt-2 text-gray-500">For custom subdomains, use the one you created during registration.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
