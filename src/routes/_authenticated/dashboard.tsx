import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Users, Grid3x3, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, Loading, Stat } from "@/components/kit";
import { useMembers, usePayments } from "@/lib/data";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import { computeSummary } from "@/lib/summary";
import { dueDateLabel, randFormat } from "@/lib/stokvel";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Stokvel dashboard - Stokvel Tracker SA" },
      {
        name: "description",
        content: "See how much your stokvel has collected, what is outstanding and the balance.",
      },
      { property: "og:title", content: "Stokvel dashboard - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Collected, outstanding and balance for your stokvel at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useT();
  const year = new Date().getFullYear();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: members = [] } = useMembers(stokvel?.id);
  const { data: payments = [] } = usePayments(stokvel?.id, year);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const s = computeSummary(stokvel, members, payments, year);

  const actions = [
    { to: "/members", icon: Users, label: t("navMembers") },
    { to: "/payments", icon: Grid3x3, label: t("navPayments") },
    { to: "/reminders", icon: MessageCircle, label: t("navRemind") },
  ] as const;

  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-2xl font-bold leading-tight">{stokvel.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {randFormat(stokvel.monthly_contribution)} {t("perMonth")} - {t("meetsOn")}{" "}
          {stokvel.meeting_day}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("collected")} value={randFormat(s.collected)} tone="gold" />
        <Stat label={t("outstanding")} value={randFormat(s.outstanding)} />
        <Stat label={t("balance")} value={randFormat(s.balance)} tone="gold" />
        <Stat label={t("members")} value={String(members.length)} />
      </div>

      <Card className="mt-4 flex items-center gap-3">
        <CalendarDays className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{t("dueOn")}</div>
          <div className="truncate text-sm text-muted-foreground">
            {dueDateLabel(stokvel.meeting_day)} - {t("paidThisMonth")}: {s.paidThisMonth}/
            {members.length}
          </div>
        </div>
      </Card>

      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t("quickActions")}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}>
            <Card className="flex min-h-24 flex-col items-center justify-center gap-2 text-center">
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              <span className="text-xs font-semibold">{label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
