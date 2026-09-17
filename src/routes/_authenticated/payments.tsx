import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Empty, Loading, PageTitle, Stat } from "@/components/kit";
import { useMembers, usePayments, useTogglePayment } from "@/lib/data";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import { computeSummary } from "@/lib/summary";
import { randFormat } from "@/lib/stokvel";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments grid - Stokvel Tracker SA" },
      {
        name: "description",
        content:
          "Mark contributions paid or unpaid month by month and see collected, outstanding and balance totals.",
      },
      { property: "og:title", content: "Payments grid - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Tap a month to mark a member paid, and watch the totals update.",
      },
    ],
  }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const { t, months } = useT();
  const [year, setYear] = React.useState(new Date().getFullYear());
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: members = [] } = useMembers(stokvel?.id);
  const { data: payments = [], isLoading: loadingPayments } = usePayments(stokvel?.id, year);
  const toggle = useTogglePayment(stokvel?.id, year);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const s = computeSummary(stokvel, members, payments, year);
  const cellId = new Map(payments.map((p) => [`${p.member_id}-${p.month}`, p.id] as const));

  function onToggle(memberId: string, month: number) {
    const existingId = cellId.get(`${memberId}-${month}`);
    toggle.mutate(
      { memberId, month, existingId, amount: stokvel!.monthly_contribution },
      { onError: () => toast.error(t("somethingWrong")) },
    );
  }

  return (
    <AppShell>
      <PageTitle subtitle={t("tapToToggle")}>{t("paymentsTitle")}</PageTitle>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-semibold">{t("year")}</span>
        <button
          type="button"
          className="tap-target rounded-xl border border-border px-4 font-semibold"
          onClick={() => setYear((y) => y - 1)}
          aria-label="Previous year"
        >
          -
        </button>
        <span className="min-w-16 text-center text-lg font-bold tabular-nums">{year}</span>
        <button
          type="button"
          className="tap-target rounded-xl border border-border px-4 font-semibold"
          onClick={() => setYear((y) => y + 1)}
          aria-label="Next year"
        >
          +
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label={t("collected")} value={randFormat(s.collected)} tone="gold" />
        <Stat label={t("outstanding")} value={randFormat(s.outstanding)} />
        <Stat label={t("balance")} value={randFormat(s.balance)} tone="gold" />
      </div>

      <div className="mb-4">
        <Link to="/chat">
          <Button variant="outline" size="sm" className="w-full">
            <MessageCircle className="h-4 w-4" />
            Transaction Chat
          </Button>
        </Link>
      </div>

      {loadingPayments ? (
        <Loading label={t("loading")} />
      ) : members.length === 0 ? (
        <Empty>{t("noMembers")}</Empty>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <table className="border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-background text-left text-xs font-bold text-muted-foreground">
                  {t("members")}
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="w-12 text-center text-xs font-bold text-muted-foreground"
                    scope="col"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-28 bg-background pr-2 text-left text-sm font-semibold"
                  >
                    <span className="block max-w-28 truncate">{member.name}</span>
                  </th>
                  {months.map((label, i) => {
                    const month = i + 1;
                    const isPaid = cellId.has(`${member.id}-${month}`);
                    return (
                      <td key={month}>
                        <button
                          type="button"
                          onClick={() => onToggle(member.id, month)}
                          aria-label={`${member.name} ${label} - ${isPaid ? t("paid") : t("unpaid")}`}
                          className={cn(
                            "h-12 w-12 rounded-xl border-2 text-sm font-bold",
                            isPaid
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-muted-foreground",
                          )}
                        >
                          {isPaid ? "✓" : "-"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
