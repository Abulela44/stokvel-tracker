import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, PageTitle } from "@/components/kit";
import { useT } from "@/lib/i18n";
import { FREE_MEMBER_LIMIT } from "@/lib/stokvel";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Plans and pricing - Stokvel Tracker SA" },
      {
        name: "description",
        content:
          "Free for stokvels up to 15 members. Pro is R39 a month for unlimited members and priority support.",
      },
      { property: "og:title", content: "Plans and pricing - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Free up to 15 members, or Pro at R39 a month for unlimited members.",
      },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { t } = useT();

  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <PageTitle>{t("pricingTitle")}</PageTitle>

      <div className="space-y-4">
        <Card>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">{t("free")}</h2>
            <div className="text-2xl font-bold text-primary">{t("freePrice")}</div>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[t("freeFeature1"), t("freeFeature2"), t("freeFeature3")].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-primary">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">{t("pro")}</h2>
            <div className="text-2xl font-bold text-primary">
              {t("proPrice")}
              <span className="text-sm font-semibold text-muted-foreground">{t("monthShort")}</span>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[t("proFeature1"), t("proFeature2"), t("proFeature3")].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-4 w-full" onClick={() => toast.info(t("upgradeComingSoon"))}>
            {t("upgradeToPro")}
          </Button>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {t("freeFeature1")} ({FREE_MEMBER_LIMIT})
        </p>

        <Link to="/dashboard" className="block text-center text-sm font-semibold text-primary">
          {t("navHome")}
        </Link>
      </div>
    </main>
  );
}
