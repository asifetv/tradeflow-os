"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useCustomers } from "@/lib/hooks/use-customers"
import { cn } from "@/lib/utils"

interface CustomerSelectorProps {
  value?: string | null
  onChange?: (customerId: string) => void
}

export function CustomerSelector({ value, onChange }: CustomerSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const { data: customersData, isLoading } = useCustomers(0, 100, true, undefined, search)

  const customers = customersData?.customers || []
  const selectedCustomer = customers.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCustomer ? selectedCustomer.company_name : "Select customer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search customers..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>{isLoading ? "Loading..." : "No customers found."}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === customer.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{customer.company_name}</div>
                    <div className="text-xs text-muted-foreground">{customer.customer_code}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
