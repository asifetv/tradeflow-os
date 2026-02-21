"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { authApi } from "@/lib/api"
import { useAuth } from "@/lib/hooks/use-auth"

const registerSchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Subdomain must contain only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_name: "",
      subdomain: "",
      email: "",
      password: "",
      full_name: "",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true)
    setServerError(null) // Clear previous errors
    try {
      const response = await authApi.register(values)
      const { access_token, user, company } = response.data

      // Store token in localStorage and cookies
      localStorage.setItem("access_token", access_token)
      // Store subdomain for future logins
      localStorage.setItem("company_subdomain", company.subdomain)
      // Also set cookie for middleware to access
      document.cookie = `access_token=${access_token}; path=/; max-age=86400`

      // Update auth store
      setAuth(user, company, access_token)

      toast.success("Registration successful! Welcome to TradeFlow OS")
      router.push("/")
    } catch (error: any) {
      console.error("Registration error:", error)
      console.error("Response data:", error.response?.data)
      console.error("Response status:", error.response?.status)

      let errorMessage = "Registration failed. Please try again."
      let fieldError: "subdomain" | "email" | null = null

      // Detailed error handling
      if (error.response?.status === 400) {
        const detail = error.response?.data?.detail || ""

        if (detail.toLowerCase().includes("subdomain")) {
          errorMessage = "This subdomain is already taken. Please choose another one."
          fieldError = "subdomain"
          form.setError("subdomain", {
            type: "manual",
            message: "This subdomain is already taken",
          })
        } else if (detail.toLowerCase().includes("email")) {
          errorMessage = "This email is already registered. Please login or use a different email."
          fieldError = "email"
          form.setError("email", {
            type: "manual",
            message: "This email is already registered",
          })
        } else {
          errorMessage = detail || "Registration failed. Please try again."
        }
      } else if (error.response?.status === 422) {
        // Validation error
        const validationErrors = error.response?.data?.detail
        if (Array.isArray(validationErrors)) {
          errorMessage = validationErrors[0]?.msg || "Invalid input. Please check your fields."
        } else {
          errorMessage = "Invalid input. Please check your fields."
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      // Display error prominently
      setServerError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Start your TradeFlow OS journey</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Error Alert */}
              {serverError && (
                <div className="flex gap-3 p-3 bg-red-50 border border-red-300 rounded-md">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-red-800 font-medium text-sm">{serverError}</div>
                </div>
              )}

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Company Information</h3>

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="ADNOC Trading" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomain</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input placeholder="adnoc" {...field} className="rounded-r-none" />
                          <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                            .tradeflow.com
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>Unique identifier for your company workspace</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Admin User Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700">Admin Account</h3>

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
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
                      <FormDescription>Emails are globally unique - cannot be used in multiple companies</FormDescription>
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
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/auth/login" className="text-blue-600 hover:underline font-semibold">
                  Login
                </a>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
