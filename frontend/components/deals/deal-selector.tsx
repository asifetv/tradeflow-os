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
import { useDeals } from "@/lib/hooks/use-deals"
import { cn } from "@/lib/utils"

interface DealSelectorProps {
  value?: string | null
  onChange?: (dealId: string) => void
}

export function DealSelector({ value, onChange }: DealSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Load all deals once
  const { data: dealsData, isLoading } = useDeals(0, 50)

  const deals = dealsData?.deals || []
  const selectedDeal = deals.find((d) => d.id === value)

  // Client-side filtering (no API calls on search)
  const filteredDeals = React.useMemo(() => {
    if (!search) return deals
    return deals.filter(
      (deal) =>
        deal.deal_number.toLowerCase().includes(search.toLowerCase()) ||
        deal.description?.toLowerCase().includes(search.toLowerCase())
    )
  }, [deals, search])

  const handleSelect = (dealId: string) => {
    onChange?.(dealId)
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
            selectedDeal ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {selectedDeal
              ? `${selectedDeal.deal_number} - ${selectedDeal.description?.substring(0, 20)}`
              : "Select deal..."}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {selectedDeal && (
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
            placeholder="Search deals by number or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
            autoFocus
          />
          {!isLoading && (
            <div className="text-xs text-muted-foreground">
              {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""} available
            </div>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Loading deals...</span>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? "No deals found" : "No deals available"}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {filteredDeals.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => handleSelect(deal.id)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100",
                    value === deal.id && "bg-blue-50 border-l-2 border-l-blue-500"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 transition-opacity",
                        value === deal.id ? "opacity-100 text-blue-600" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{deal.deal_number}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {deal.description?.substring(0, 40)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-2">
          <Link href="/deals/new" className="w-full block">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              + Create New Deal
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
