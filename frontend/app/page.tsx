import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">TradeFlow OS</h1>
        <p className="text-xl text-gray-600 mb-8">
          Production-grade oil & gas trading platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/deals">
            <Button size="lg">
              Go to Deals
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-8">
          M1 - Deal Hub (Core deal management functionality)
        </p>
      </div>
    </main>
  )
}
