import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Empty, Field, Input, Loading, PageTitle } from "@/components/kit";
import { useAddMember, useMembers, usePayments, useRemoveMember } from "@/lib/data";
import { useProofs } from "@/lib/community";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import { computeSummary } from "@/lib/summary";
import { FREE_MEMBER_LIMIT, isValidSaPhone, randFormat, toWaNumber, waLink } from "@/lib/stokvel";

type MemberStatus = "due" | "sent" | "confirmed";

const STATUS_DOT: Record<MemberStatus, string> = {
  due: "bg-destructive",
  sent: "bg-primary",
  confirmed: "bg-success",
};

function StatusDot({ status, label }: { status: MemberStatus; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={`inline-block h-3 w-3 shrink-0 rounded-full ${STATUS_DOT[status]}`}
        aria-hidden
      />
      <span>{label}</span>
    </span>
  );
}

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({
    meta: [
      { title: "Members - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Add stokvel members, track what each one has paid and invite them on WhatsApp.",
      },
      { property: "og:title", content: "Members - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Add members, track payments per person and send WhatsApp invites.",
      },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const { t } = useT();
  const year = new Date().getFullYear();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: members = [], isLoading: loadingMembers } = useMembers(stokvel?.id);
  const { data: payments = [] } = usePayments(stokvel?.id, year);
  const { data: proofs = [] } = useProofs(stokvel?.id);
  const addMember = useAddMember(stokvel?.id, members.length + 1);
  const removeMember = useRemoveMember(stokvel?.id);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [open, setOpen] = React.useState(false);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const s = computeSummary(stokvel, members, payments, year);
  const isFree = stokvel.tier !== "pro";
  const atLimit = isFree && members.length >= FREE_MEMBER_LIMIT;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error(t("memberName"));
      return;
    }
    if (!isValidSaPhone(phone)) {
      toast.error(t("phoneHint"));
      return;
    }
    try {
      await addMember.mutateAsync({ name: name.trim(), phone: toWaNumber(phone) });
      setName("");
      setPhone("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("somethingWrong"));
    }
  }

  function inviteMessage(memberName: string) {
    return t("waInvite", {
      name: memberName,
      stokvel: stokvel!.name,
      amount: randFormat(stokvel!.monthly_contribution),
      day: stokvel!.meeting_day,
      admin: stokvel!.admin_phone,
    });
  }

  return (
    <AppShell>
      <PageTitle subtitle={`${members.length}${isFree ? ` / ${FREE_MEMBER_LIMIT}` : ""}`}>
        {t("members")}
      </PageTitle>

      {atLimit ? (
        <Card className="mb-4 border-primary">
          <h2 className="font-bold text-primary">{t("freeLimitTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("freeLimitBody")}</p>
          <Link to="/pricing" className="mt-3 block">
            <Button className="w-full">{t("upgradeToPro")}</Button>
          </Link>
        </Card>
      ) : open ? (
        <Card className="mb-4">
          <form onSubmit={submit} className="space-y-4">
            <Field label={t("memberName")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label={t("memberPhone")} hint={t("phoneHint")}>
              <Input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0821234567"
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={addMember.isPending}>
                {addMember.isPending ? t("saving") : t("save")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button className="mb-4 w-full" onClick={() => setOpen(true)}>
          <UserPlus className="h-5 w-5" aria-hidden />
          {t("addMember")}
        </Button>
      )}

      {loadingMembers ? (
        <Loading label={t("loading")} />
      ) : members.length === 0 ? (
        <Empty>{t("noMembers")}</Empty>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => (
            <Card key={m.id} className="space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="truncate font-bold">{m.name}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {m.phone || t("noPhone")}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={t("removeMember")}
                  className="tap-target shrink-0 rounded-xl text-destructive"
                  onClick={() => {
                    if (window.confirm(t("removeMemberConfirm"))) removeMember.mutate(m.id);
                  }}
                >
                  <Trash2 className="mx-auto h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-muted-foreground">{t("totalPaid")}:</span>
                <span className="font-semibold text-primary tabular-nums">
                  {randFormat(s.paidByMember.get(m.id) ?? 0)}
                </span>
                <span className="text-muted-foreground">{t("owing")}:</span>
                <span className="font-semibold tabular-nums">
                  {randFormat(s.outstandingByMember.get(m.id) ?? 0)}
                </span>
              </div>
              <a href={waLink(m.phone, inviteMessage(m.name))} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="w-full">
                  {t("inviteWhatsapp")}
                </Button>
              </a>
            </Card>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
