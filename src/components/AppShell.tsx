import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Home, Users, Grid3x3, Repeat, MessageCircle, Settings } from "lucide-react";
import { useT } from "@/lib/i18n";

const tabs = [
  { to: "/dashboard", icon: Home, key: "navHome" },
  { to: "/members", icon: Users, key: "navMembers" },
  { to: "/payments", icon: Grid3x3, key: "navPayments" },
  { to: "/rotation", icon: Repeat, key: "navPayout" },
  { to: "/reminders", icon: MessageCircle, key: "navRemind" },
  { to: "/settings", icon: Settings, key: "navSettings" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-md px-4 pt-5">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
        <div className="mx-auto grid max-w-md grid-cols-6">
          {tabs.map(({ to, icon: Icon, key }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-semibold text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="h-6 w-6" aria-hidden />
              <span className="truncate">{t(key)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
