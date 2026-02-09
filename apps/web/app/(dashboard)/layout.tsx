import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  Megaphone,
  MessageSquare,
  Plug,
  GitBranch,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Pipeline", href: "/pipeline", icon: GitBranch },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border bg-background">
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="text-xl font-bold text-foreground">Fred</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <h2 className="text-sm font-medium text-muted-foreground">
            My Company
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              U
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
