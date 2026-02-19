import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TopNav() {
  return (
    <div className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <Link href="/" className="inline-block">
          <Button variant="ghost" size="icon" className="hover:bg-slate-100" title="Home">
            <Home className="h-5 w-5 text-slate-600" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
