import { Sidebar } from "@/components/Sidebar"
import { TopBar } from "@/components/TopBar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#faf9fd] overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen min-w-0">
        <TopBar />
        {/* pb-20 garante espaço para o bottom nav no mobile + safe area iOS */}
        <div className="flex-1 min-w-0 pb-20 md:pb-0">{children}</div>
      </div>
    </div>
  )
}
