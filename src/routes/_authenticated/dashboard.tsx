import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Users,
  Grid3x3,
  MessageCircle,
  ShieldCheck,
  Check,
  X,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Loading, Stat } from "@/components/kit";
import { useMembers, usePayments, useStokvel } from "@/lib/data";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import { computeSummary } from "@/lib/summary";
import { dueDateLabel, randFormat } from "@/lib/stokvel";
import {
  type ProofMeta,
  loadProofMeta,
  updateProofMeta,
  removeProofMeta,
  deleteFile,
  getFile,
  downloadBlob,
  formatBytes,
  storageLabel,
} from "@/lib/proofStorage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Stokvel dashboard - Stokvel Tracker SA" },
      {
        name: "description",
        content: "See how much your stokvel has collected, what is outstanding and the balance.",
      },
      { property: "og:title", content: "Stokvel dashboard - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Collected, outstanding and balance for your stokvel at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useT();
  const year = new Date().getFullYear();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: members = [] } = useMembers(stokvel?.id);
  const { data: payments = [] } = usePayments(stokvel?.id, year);

  const [proofs, setProofs] = React.useState<ProofMeta[]>([]);
  const [lightboxId, setLightboxId] = React.useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [storageText, setStorageText] = React.useState("");

  React.useEffect(() => {
    setProofs(loadProofMeta());
    setStorageText(storageLabel());
  }, []);

  const refreshProofs = React.useCallback(() => {
    setProofs(loadProofMeta());
    setStorageText(storageLabel());
  }, []);

  // Load lightbox content
  React.useEffect(() => {
    if (!lightboxId) {
      setLightboxUrl(null);
      return;
    }
    let url: string | null = null;
    getFile(lightboxId).then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setLightboxUrl(url);
      }
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [lightboxId]);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const s = computeSummary(stokvel, members, payments, year);
  const pendingProofs = proofs.filter((p) => p.reviewStatus === "pending");

  const actions = [
    { to: "/members", icon: Users, label: t("navMembers") },
    { to: "/payments", icon: Grid3x3, label: t("navPayments") },
    { to: "/reminders", icon: MessageCircle, label: t("navRemind") },
  ] as const;

  async function onApprove(id: string) {
    updateProofMeta(id, { reviewStatus: "approved" });
    refreshProofs();
    setLightboxId(null);
  }

  async function onReject(id: string) {
    updateProofMeta(id, { reviewStatus: "rejected" });
    await deleteFile(id);
    removeProofMeta(id);
    refreshProofs();
    setLightboxId(null);
  }

  async function onDownload(meta: ProofMeta) {
    const blob = await getFile(meta.id);
    if (blob) downloadBlob(blob, meta.fileName);
  }

  const lightboxProof = proofs.find((p) => p.id === lightboxId);

  return (
    <AppShell>
      <header className="mb-4">
        <h1 className="text-2xl font-bold leading-tight">{stokvel.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {randFormat(stokvel.monthly_contribution)} {t("perMonth")} - {t("meetsOn")}{" "}
          {stokvel.meeting_day}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("collected")} value={randFormat(s.collected)} tone="gold" />
        <Stat label={t("outstanding")} value={randFormat(s.outstanding)} />
        <Stat label={t("balance")} value={randFormat(s.balance)} tone="gold" />
        <Stat label={t("members")} value={String(members.length)} />
      </div>

      <Card className="mt-4 flex items-center gap-3">
        <CalendarDays className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <div className="text-sm font-semibold">{t("dueOn")}</div>
          <div className="truncate text-sm text-muted-foreground">
            {dueDateLabel(stokvel.meeting_day)} - {t("paidThisMonth")}: {s.paidThisMonth}/
            {members.length}
          </div>
        </div>
      </Card>

      {/* Proofs to Review section */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Proofs to Review
          </h2>
          {pendingProofs.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {pendingProofs.length} pending
            </span>
          )}
        </div>

        {storageText && (
          <p className="mb-2 text-[10px] text-muted-foreground">{storageText}</p>
        )}

        {proofs.length === 0 ? (
          <Card className="text-center text-sm text-muted-foreground">
            No proofs uploaded yet.
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {proofs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightboxId(p.id)}
                className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                {p.isImage ? (
                  <ProofThumb id={p.id} />
                ) : (
                  <div className="flex h-24 items-center justify-center bg-gray-50">
                    <FileText className="h-8 w-8 text-gray-300" />
                  </div>
                )}
                <div className="p-1.5">
                  <div className="truncate text-[10px] font-semibold text-gray-900">
                    {p.memberName}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {randFormat(p.amount)} · {formatBytes(p.fileSize)}
                  </div>
                </div>
                {p.reviewStatus === "pending" && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-400" />
                )}
                {p.reviewStatus === "approved" && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
                {p.reviewStatus === "rejected" && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                    <X className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {t("quickActions")}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {actions.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}>
            <Card className="flex min-h-24 flex-col items-center justify-center gap-2 text-center">
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              <span className="text-xs font-semibold">{label}</span>
            </Card>
          </Link>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxId && lightboxProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxId(null)}
        >
          <div
            className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-gray-900">
                  {lightboxProof.fileName}
                </div>
                <div className="text-xs text-gray-500">
                  {lightboxProof.memberName} · {randFormat(lightboxProof.amount)} ·{" "}
                  {formatBytes(lightboxProof.fileSize)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-50 p-4">
              {lightboxProof.isImage ? (
                lightboxUrl ? (
                  <img
                    src={lightboxUrl}
                    alt={lightboxProof.fileName}
                    className="max-h-80 max-w-full rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-40 items-center text-sm text-gray-400">
                    Loading...
                  </div>
                )
              ) : lightboxUrl ? (
                <iframe
                  src={lightboxUrl}
                  title={lightboxProof.fileName}
                  className="h-80 w-full rounded-lg border-0"
                />
              ) : (
                <div className="flex h-40 items-center text-sm text-gray-400">
                  Loading...
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={() => onApprove(lightboxProof.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white transition-colors active:bg-green-600"
              >
                <Check className="h-4 w-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => onReject(lightboxProof.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-colors active:bg-red-600"
              >
                <X className="h-4 w-4" /> Reject
              </button>
              <button
                type="button"
                onClick={() => onDownload(lightboxProof)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600"
                aria-label="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ProofThumb({ id }: { id: string }) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let objUrl: string | null = null;
    getFile(id).then((blob) => {
      if (blob) {
        objUrl = URL.createObjectURL(blob);
        setUrl(objUrl);
      }
    });
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [id]);

  if (url) {
    return (
      <img src={url} alt="Proof" className="h-24 w-full object-cover" />
    );
  }
  return (
    <div className="flex h-24 items-center justify-center bg-gray-50">
      <ImageIcon className="h-6 w-6 text-gray-300" />
    </div>
  );
}
