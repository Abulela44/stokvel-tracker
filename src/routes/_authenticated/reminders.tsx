import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Empty, Loading, PageTitle } from "@/components/kit";
import { useMembers, usePayments } from "@/lib/data";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import { computeSummary } from "@/lib/summary";
import { dueDateLabel, randFormat, waLink } from "@/lib/stokvel";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "WhatsApp reminders - Stokvel Tracker SA" },
      {
        name: "description",
        content:
          "Send each member a personalised WhatsApp reminder with their due date and outstanding balance.",
      },
      { property: "og:title", content: "WhatsApp reminders - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Personalised WhatsApp reminders with due date and balance, ready to send.",
      },
    ],
  }),
  component: RemindersPage,
});

function RemindersPage() {
  const { t } = useT();
  const year = new Date().getFullYear();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: members = [], isLoading: loadingMembers } = useMembers(stokvel?.id);
  const { data: payments = [] } = usePayments(stokvel?.id, year);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const s = computeSummary(stokvel, members, payments, year);
  const due = dueDateLabel(stokvel.meeting_day);

  return (
    <AppShell>
      <PageTitle subtitle={t("remindHint")}>{t("remindTitle")}</PageTitle>

      {loadingMembers ? (
        <Loading label={t("loading")} />
      ) : members.length === 0 ? (
        <Empty>{t("noMembers")}</Empty>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => {
            const balance = s.outstandingByMember.get(m.id) ?? 0;
            const message = t("waReminder", {
              name: m.name,
              stokvel: stokvel.name,
              amount: randFormat(stokvel.monthly_contribution),
              due,
              balance: randFormat(balance),
            });
            return (
              <Card key={m.id} className="space-y-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{m.name}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {t("owing")}: {randFormat(balance)}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    {t("dueOn")} {due}
                  </span>
                </div>
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-primary">
                    {t("messagePreview")}
                  </summary>
                  <p className="mt-2 rounded-xl bg-muted p-3 text-sm text-foreground">{message}</p>
                </details>
                <a href={waLink(m.phone, message)} target="_blank" rel="noreferrer">
                  <Button className="w-full" size="sm">
                    <Send className="h-4 w-4" aria-hidden />
                    {t("sendReminder")}
                  </Button>
                </a>
              </Card>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
