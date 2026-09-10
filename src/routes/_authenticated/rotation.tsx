import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, Empty, Loading, PageTitle, Stat } from "@/components/kit";
import { useMembers, usePayments, useReorderMembers, type Member } from "@/lib/data";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import { computeSummary } from "@/lib/summary";
import { randFormat } from "@/lib/stokvel";

export const Route = createFileRoute("/_authenticated/rotation")({
  head: () => ({
    meta: [
      { title: "Payout rotation - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Set the order members get paid out and see each payout amount and month.",
      },
      { property: "og:title", content: "Payout rotation - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Decide who gets paid when, with payout amounts worked out for you.",
      },
    ],
  }),
  component: RotationPage,
});

function RotationPage() {
  const { t, months } = useT();
  const year = new Date().getFullYear();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: members = [], isLoading: loadingMembers } = useMembers(stokvel?.id);
  const { data: payments = [] } = usePayments(stokvel?.id, year);
  const reorder = useReorderMembers(stokvel?.id);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const s = computeSummary(stokvel, members, payments, year);
  

  function move(index: number, direction: -1 | 1) {
    const next: Member[] = [...members];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    reorder.mutate(next);
  }

  return (
    <AppShell>
      <PageTitle subtitle={t("payoutOrderHint")}>{t("payoutTitle")}</PageTitle>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat label={t("payoutAmount")} value={randFormat(s.payoutAmount)} tone="gold" />
        <Stat label={t("inThePot")} value={randFormat(s.balance)} />
      </div>

      {loadingMembers ? (
        <Loading label={t("loading")} />
      ) : members.length === 0 ? (
        <Empty>{t("noMembers")}</Empty>
      ) : (
        <ol className="space-y-3">
          {members.map((m, i) => {
            const month = ((i % 12) + 1) as number;
            const done = i < s.payoutsMade;

            return (
              <Card key={m.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold">{m.name}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {t("payoutMonth")}: {months[month - 1]} - {randFormat(s.payoutAmount)}
                  </div>
                  <div
                    className={
                      done ? "text-xs font-semibold text-primary" : "text-xs text-muted-foreground"
                    }
                  >
                    {done ? t("paidOut") : t("upcoming")}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    aria-label={t("moveUp")}
                    disabled={i === 0 || reorder.isPending}
                    onClick={() => move(i, -1)}
                    className="grid h-11 w-11 place-items-center rounded-xl border border-border disabled:opacity-40"
                  >
                    <ArrowUp className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={t("moveDown")}
                    disabled={i === members.length - 1 || reorder.isPending}
                    onClick={() => move(i, 1)}
                    className="grid h-11 w-11 place-items-center rounded-xl border border-border disabled:opacity-40"
                  >
                    <ArrowDown className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </Card>
            );
          })}
        </ol>
      )}
    </AppShell>
  );
}
