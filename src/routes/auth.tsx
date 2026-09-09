import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button, Field, Input, PageTitle } from "@/components/kit";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useT } from "@/lib/i18n";
import { isValidSaPhone, phoneToLogin, toWaNumber } from "@/lib/stokvel";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: Mode } => ({
    mode: search.mode === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Sign in with your phone number to manage your stokvel contributions and payouts.",
      },
      { property: "og:title", content: "Sign in - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Sign in with your phone number to manage your stokvel.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useT();
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidSaPhone(phone)) {
      toast.error(t("phoneHint"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("passwordHint"));
      return;
    }
    setBusy(true);
    const email = phoneToLogin(phone);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { phone: toWaNumber(phone) } },
        });
        if (error && !/already registered/i.test(error.message)) throw error;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 py-8">
      <PageTitle subtitle={t("authSubtitle")}>{t("authTitle")}</PageTitle>

      <form onSubmit={submit} className="space-y-4">
        <Field label={t("phone")} hint={t("phoneHint")}>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0821234567"
          />
        </Field>
        <Field label={t("password")} hint={t("passwordHint")}>
          <Input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t("loading") : mode === "signup" ? t("signUp") : t("signIn")}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          to="/auth"
          search={{ mode: mode === "signup" ? "signin" : "signup" }}
          className="text-sm font-semibold text-primary"
        >
          {mode === "signup" ? t("haveAccount") : t("needAccount")}
        </Link>
      </div>

      <div className="mt-8">
        <p className="mb-2 text-sm font-semibold">{t("language")}</p>
        <LanguagePicker />
      </div>
    </main>
  );
}
