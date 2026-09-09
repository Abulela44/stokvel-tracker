import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Grid3x3, Repeat, MessageCircle } from "lucide-react";
import { Button, Card } from "@/components/kit";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stokvel Tracker SA - Track contributions and payouts" },
      {
        name: "description",
        content:
          "A light, mobile-first way to run a South African stokvel: members, monthly contributions, a payment grid, payout rotation and WhatsApp reminders.",
      },
      { property: "og:title", content: "Stokvel Tracker SA" },
      {
        property: "og:description",
        content:
          "Run your stokvel from your phone: contributions, payment grid, payout rotation and WhatsApp reminders.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useT();

  const points = [
    { icon: Users, text: t("navMembers") },
    { icon: Grid3x3, text: t("navPayments") },
    { icon: Repeat, text: t("payoutTitle") },
    { icon: MessageCircle, text: t("remindTitle") },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-5 py-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          South Africa
        </p>
        <h1 className="mt-2 text-4xl font-bold leading-tight">{t("appName")}</h1>
        <p className="mt-3 text-base text-muted-foreground">{t("tagline")}</p>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">{t("chooseLanguage")}</p>
          <LanguagePicker />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {points.map(({ icon: Icon, text }) => (
            <Card key={text} className="flex items-center gap-2 p-3">
              <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0 text-sm font-semibold">{text}</span>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Link to="/auth" search={{ mode: "signup" }} className="block">
          <Button className="w-full">{t("getStarted")}</Button>
        </Link>
        <Link to="/auth" search={{ mode: "signin" }} className="block">
          <Button variant="outline" className="w-full">
            {t("signIn")}
          </Button>
        </Link>
        <Link to="/pricing" className="block text-center text-sm font-semibold text-primary">
          {t("seePricing")}
        </Link>
      </div>
    </main>
  );
}
