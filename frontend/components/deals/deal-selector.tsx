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
import { useDeals } from "@/lib/hooks/use-deals"
import { cn } from "@/lib/utils"

interface DealSelectorProps {
  value?: string | null
  onChange?: (dealId: string) => void
}

export function DealSelector({ value, onChange }: DealSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const { data: dealsData, isLoading } = useDeals(0, 100)

  const deals = dealsData?.deals || []
  const selectedDeal = deals.find((d) => d.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedDeal ? `${selectedDeal.deal_number} - ${selectedDeal.description?.substring(0, 30)}` : "Select deal..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search deals..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>{isLoading ? "Loading..." : "No deals found."}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {deals.map((deal) => (
                <CommandItem
                  key={deal.id}
                  value={deal.id}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === deal.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{deal.deal_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {deal.description?.substring(0, 50)}...
                    </div>
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
