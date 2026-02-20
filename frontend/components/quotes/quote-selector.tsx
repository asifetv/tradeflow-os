"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useQuotes } from "@/lib/hooks/use-quotes"
import { cn } from "@/lib/utils"
import { UUID } from "crypto"

interface QuoteSelectorProps {
  value?: string | null
  onChange?: (quoteId: string) => void
  onQuoteSelect?: (quote: any) => void
  customerId?: string
  dealId?: string
}

export function QuoteSelector({
  value,
  onChange,
  onQuoteSelect,
  customerId,
  dealId
}: QuoteSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: quotesData, isLoading } = useQuotes(
    0,
    50,
    customerId,
    dealId,
    undefined
  )

  const quotes = quotesData?.quotes || []
  const selectedQuote = quotes.find((q) => q.id === value)

  const handleSelect = (quote: any) => {
    onChange?.(quote.id)
    onQuoteSelect?.(quote)
    setOpen(false)
    setSearch("")
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
    setSearch("")
  }

  // Filter quotes by search
  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    quote.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

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
            selectedQuote ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {selectedQuote ? `${selectedQuote.quote_number} - ${selectedQuote.title}` : "Select quote..."}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            {selectedQuote && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer shrink-0"
                onClick={handleClear}
              />
            )}
            {!isLoading && <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <div className="flex flex-col gap-2 p-3">
          <Input
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />

          <div className="max-h-64 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No quotes found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredQuotes.map((quote) => (
                  <button
                    key={quote.id}
                    onClick={() => handleSelect(quote)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-slate-100 transition-colors",
                      value === quote.id && "bg-blue-50 text-blue-900"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {value === quote.id && <Check className="h-4 w-4 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{quote.quote_number}</div>
                        <div className="text-xs text-muted-foreground truncate">{quote.title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {quote.currency} {quote.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
