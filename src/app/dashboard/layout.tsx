import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      <Sidebar className="hidden md:block w-64 shrink-0" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  )
}
