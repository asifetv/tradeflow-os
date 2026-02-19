"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useCustomers } from "@/lib/hooks/use-customers"
import { cn } from "@/lib/utils"

interface CustomerSelectorProps {
  value?: string | null
  onChange?: (customerId: string) => void
}

export function CustomerSelector({ value, onChange }: CustomerSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: customersData, isLoading } = useCustomers(
    0,
    50,
    true,
    undefined,
    debouncedSearch
  )

  const customers = customersData?.customers || []
  const selectedCustomer = customers.find((c) => c.id === value)

  const handleSelect = (customerId: string) => {
    onChange?.(customerId)
    setOpen(false)
    setSearch("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between gap-2 px-3 hover:bg-slate-50",
            open && "ring-2 ring-blue-500"
          )}
        >
          <span className={cn(
            "truncate flex-1 text-left",
            selectedCustomer ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {selectedCustomer ? selectedCustomer.company_name : "Select customer..."}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {selectedCustomer && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer shrink-0"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg"
        align="start"
        sideOffset={4}
      >
        <div className="p-3 border-b space-y-2">
          <Input
            placeholder="Search by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
            autoFocus
          />
          {search && (
            <div className="text-xs text-muted-foreground">
              Found {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {isLoading && debouncedSearch ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? "No customers found" : "No customers available"}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer.id)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100",
                    value === customer.id && "bg-blue-50 border-l-2 border-l-blue-500"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 transition-opacity",
                        value === customer.id ? "opacity-100 text-blue-600" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{customer.company_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {customer.customer_code}
                        {customer.country && ` • ${customer.country}`}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Link href="/customers/new" className="w-full block">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              + Create New Customer
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
