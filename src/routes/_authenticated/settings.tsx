import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Field, Input, Loading, PageTitle } from "@/components/kit";
import { LanguagePicker } from "@/components/LanguagePicker";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateStokvel } from "@/lib/data";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import {
  MAX_CONTRIBUTION,
  MIN_CONTRIBUTION,
  isValidSaPhone,
  randFormat,
  toWaNumber,
} from "@/lib/stokvel";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Change your language, stokvel details, contribution amount and meeting day.",
      },
      { property: "og:title", content: "Settings - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Change your language and your stokvel details.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const update = useUpdateStokvel();

  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState(200);
  const [day, setDay] = React.useState(25);
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    if (!stokvel) return;
    setName(stokvel.name);
    setAmount(stokvel.monthly_contribution);
    setDay(stokvel.meeting_day);
    setPhone(stokvel.admin_phone.replace(/^27/, "0"));
  }, [stokvel]);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error(t("stokvelName"));
      return;
    }
    if (!isValidSaPhone(phone)) {
      toast.error(t("phoneHint"));
      return;
    }
    try {
      await update.mutateAsync({
        id: stokvel!.id,
        name: name.trim(),
        monthly_contribution: Math.min(Math.max(amount, MIN_CONTRIBUTION), MAX_CONTRIBUTION),
        meeting_day: Math.min(Math.max(day, 1), 28),
        admin_phone: toWaNumber(phone),
      });
      toast.success(t("savedChanges"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("somethingWrong"));
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  return (
    <AppShell>
      <PageTitle>{t("settingsTitle")}</PageTitle>

      <Card className="mb-4">
        <h2 className="mb-3 font-bold">{t("language")}</h2>
        <LanguagePicker />
      </Card>

      <Card className="mb-4">
        <h2 className="mb-3 font-bold">{t("stokvelDetails")}</h2>
        <form onSubmit={save} className="space-y-4">
          <Field label={t("stokvelName")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field
            label={`${t("monthlyContribution")} - ${randFormat(amount)}`}
            hint={t("contributionRange")}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={MIN_CONTRIBUTION}
              max={MAX_CONTRIBUTION}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>
          <Field label={t("meetingDay")}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            />
          </Field>
          <Field label={t("adminPhone")} hint={t("phoneHint")}>
            <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={update.isPending}>
            {update.isPending ? t("saving") : t("save")}
          </Button>
        </form>
      </Card>

      <Card className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{t("plan")}</div>
          <div className="truncate text-sm text-muted-foreground">
            {stokvel.tier === "pro" ? t("pro") : t("free")} - {t("currentPlan")}
          </div>
        </div>
        <Link to="/pricing" className="shrink-0">
          <Button variant="outline" size="sm">
            {t("seePricing")}
          </Button>
        </Link>
      </Card>

      <Button variant="danger" className="w-full" onClick={signOut}>
        {t("signOut")}
      </Button>
    </AppShell>
  );
}
