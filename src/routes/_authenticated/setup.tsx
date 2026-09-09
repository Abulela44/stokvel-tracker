import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button, Card, Field, Input, Loading, PageTitle } from "@/components/kit";
import { useStokvel } from "@/lib/data";
import { useT } from "@/lib/i18n";
import {
  MAX_CONTRIBUTION,
  MIN_CONTRIBUTION,
  isValidSaPhone,
  randFormat,
  toWaNumber,
} from "@/lib/stokvel";

export const Route = createFileRoute("/_authenticated/setup")({
  head: () => ({
    meta: [
      { title: "Create your stokvel - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Set your stokvel name, monthly contribution, meeting day and admin phone number.",
      },
      { property: "og:title", content: "Create your stokvel - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Set your stokvel name, monthly contribution and meeting day.",
      },
    ],
  }),
  component: Setup,
});

function Setup() {
  const { t } = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: existing, isLoading } = useStokvel();

  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState(200);
  const [day, setDay] = React.useState(25);
  const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (existing) navigate({ to: "/dashboard", replace: true });
  }, [existing, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error(t("stokvelName"));
      return;
    }
    if (!isValidSaPhone(phone)) {
      toast.error(t("phoneHint"));
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("stokvels").insert({
        admin_id: userData.user!.id,
        name: name.trim(),
        monthly_contribution: Math.min(Math.max(amount, MIN_CONTRIBUTION), MAX_CONTRIBUTION),
        meeting_day: Math.min(Math.max(day, 1), 28),
        admin_phone: toWaNumber(phone),
      });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["stokvel"] });
      navigate({ to: "/members", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-8">
        <Loading label={t("loading")} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <PageTitle>{t("createStokvel")}</PageTitle>
      <Card>
        <form onSubmit={submit} className="space-y-5">
          <Field label={t("stokvelName")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masakhane" />
          </Field>

          <Field label={`${t("monthlyContribution")} - ${randFormat(amount)}`} hint={t("contributionRange")}>
            <input
              type="range"
              min={MIN_CONTRIBUTION}
              max={MAX_CONTRIBUTION}
              step={50}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2 h-12 w-full accent-[var(--primary)]"
              aria-label={t("monthlyContribution")}
            />
            <Input
              type="number"
              inputMode="numeric"
              min={MIN_CONTRIBUTION}
              max={MAX_CONTRIBUTION}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-2"
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
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0821234567"
            />
          </Field>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? t("saving") : t("createStokvelCta")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
