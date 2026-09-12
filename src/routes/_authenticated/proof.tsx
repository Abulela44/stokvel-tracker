import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Empty, Field, Input, Loading, PageTitle } from "@/components/kit";
import { useT } from "@/lib/i18n";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useMembers } from "@/lib/data";
import { randFormat } from "@/lib/stokvel";
import {
  getProofPublicUrl,
  useAddProof,
  useDeleteProof,
  useProofs,
  useUpdateProof,
  type ProofStatus,
} from "@/lib/community";

export const Route = createFileRoute("/_authenticated/proof")({
  head: () => ({
    meta: [
      { title: "Payment proof - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Upload payment proof screenshots or photos, then approve or reject them.",
      },
      { property: "og:title", content: "Payment proof - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Upload and manage payment proof for your stokvel members.",
      },
    ],
  }),
  component: ProofPage,
});

function ProofPage() {
  const { t } = useT();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: members = [] } = useMembers(stokvel?.id);
  const { data: proofs = [], isLoading: loadingProofs } = useProofs(stokvel?.id);
  const addProof = useAddProof(stokvel?.id);
  const updateProof = useUpdateProof(stokvel?.id);
  const deleteProof = useDeleteProof(stokvel?.id);

  const [memberId, setMemberId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  function memberName(id: string | null): string {
    if (!id) return t("chooseMember");
    return members.find((m) => m.id === id)?.name ?? t("chooseMember");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error(t("chooseFile"));
      return;
    }
    addProof.mutate(
      {
        memberId,
        memberName: memberName(memberId),
        amount: amount ? Number(amount) : null,
        description,
        file,
      },
      {
        onSuccess: () => {
          toast.success(t("savedChanges"));
          setMemberId("");
          setAmount("");
          setDescription("");
          if (fileRef.current) fileRef.current.value = "";
        },
        onError: () => toast.error(t("somethingWrong")),
      },
    );
  }

  function setStatus(id: string, status: ProofStatus) {
    updateProof.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(t("savedChanges")),
        onError: () => toast.error(t("somethingWrong")),
      },
    );
  }

  function view(path: string) {
    const url = getProofPublicUrl(path);
    window.open(url, "_blank", "noopener");
  }

  return (
    <AppShell>
      <PageTitle subtitle={t("proofHint")}>{t("proofTitle")}</PageTitle>

      <Card>
        <h2 className="mb-3 font-bold">{t("uploadProof")}</h2>
        <form className="space-y-3" onSubmit={submit}>
          <Field label={t("member")}>
            <select
              className="tap-target w-full rounded-xl border border-border bg-input px-4 text-base text-foreground focus:border-primary focus:outline-none"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            >
              <option value="">{t("chooseMember")}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("amountOptional")}>
            <Input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="200"
            />
          </Field>
          <Field label={t("descriptionOptional")}>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="EFT reference 12345"
            />
          </Field>
          <Field label={t("chooseFile")}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="w-full text-sm"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={addProof.isPending}>
            {addProof.isPending ? t("uploading") : t("upload")}
          </Button>
        </form>
      </Card>

      <div className="mt-4 space-y-3">
        {loadingProofs ? (
          <Loading label={t("loading")} />
        ) : proofs.length === 0 ? (
          <Empty>{t("noProofs")}</Empty>
        ) : (
          proofs.map((p) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-bold">{memberName(p.member_id)}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {t("uploadedOn")} {new Date(p.created_at).toLocaleDateString("en-ZA")}
                    {p.amount ? ` - ${randFormat(p.amount)}` : ""}
                  </div>
                  {p.description ? (
                    <div className="mt-1 text-sm text-muted-foreground">{p.description}</div>
                  ) : null}
                </div>
                <span
                  className={
                    "shrink-0 rounded-lg px-2 py-1 text-xs font-semibold " +
                    (p.status === "approved"
                      ? "bg-success/20 text-success"
                      : p.status === "rejected"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-muted text-muted-foreground")
                  }
                >
                  {p.status === "approved"
                    ? t("statusApproved")
                    : p.status === "rejected"
                      ? t("statusRejected")
                      : t("statusPending")}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => view(p.file_path)}
                >
                  <Eye className="h-4 w-4" aria-hidden /> {t("viewProof")}
                </Button>
                {p.status !== "approved" ? (
                  <Button
                    size="sm"
                    onClick={() => setStatus(p.id, "approved")}
                    disabled={updateProof.isPending}
                  >
                    {t("approve")}
                  </Button>
                ) : null}
                {p.status !== "rejected" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(p.id, "rejected")}
                    disabled={updateProof.isPending}
                  >
                    {t("reject")}
                  </Button>
                ) : null}
                <button
                  aria-label={t("delete")}
                  className="ml-auto min-h-11 min-w-11 text-destructive"
                  onClick={() => {
                    if (window.confirm(t("deleteConfirm"))) deleteProof.mutate(p);
                  }}
                >
                  <Trash2 className="mx-auto h-5 w-5" aria-hidden />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
