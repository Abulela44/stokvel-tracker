import { createFileRoute, Link } from "@tanstack/react-router";
import { Repeat, ReceiptText, Settings, Crown, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, PageTitle } from "@/components/kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/more")({
  head: () => ({
    meta: [
      { title: "More tools - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Payout rotation, payment proof, reminders, settings and your plan.",
      },
      { property: "og:title", content: "More tools - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Reach payout rotation, payment proof, settings and Pro from one place.",
      },
    ],
  }),
  component: More,
});

function More() {
  const { t } = useT();

  const links = [
    { to: "/rotation", icon: Repeat, label: t("payoutTitle") },
    { to: "/proof", icon: ReceiptText, label: t("proofTitle") },
    { to: "/reminders", icon: MessageCircle, label: t("remindTitle") },
    { to: "/settings", icon: Settings, label: t("settingsTitle") },
    { to: "/pricing", icon: Crown, label: t("upgradeToPro") },
  ] as const;

  return (
    <AppShell>
      <PageTitle>{t("moreTitle")}</PageTitle>
      <div className="space-y-3">
        {links.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="block">
            <Card className="flex items-center gap-3">
              <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
              <span className="font-semibold">{label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
