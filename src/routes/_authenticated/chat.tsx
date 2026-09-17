import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  Receipt,
  Send,
  Check,
  Clock,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Loading } from "@/components/kit";
import { useMembers, usePayments, useStokvel } from "@/lib/data";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import { computeSummary } from "@/lib/summary";
import { randFormat } from "@/lib/stokvel";
import { cn } from "@/lib/utils";
import {
  type ProofMeta,
  saveFile,
  getFile,
  compressImage,
  formatBytes,
  storageLabel,
  addProofMeta,
  loadProofMeta,
  updateProofMeta,
  MAX_FILE_SIZE,
  downloadBlob,
} from "@/lib/proofStorage";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Transaction Chat - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Chat-style timeline of every contribution, payout and penalty.",
      },
    ],
  }),
  component: ChatPage,
});

type ChatType = "contribution" | "payout" | "penalty";
type ChatStatus = "confirmed" | "pending";

type ChatMessage = {
  id: string;
  memberName: string;
  amount: number;
  type: ChatType;
  status: ChatStatus;
  note: string;
  timestamp: number;
  isSystem: boolean;
  proofId?: string;
  proofFileName?: string;
  proofFileSize?: number;
  proofFileType?: string;
  proofIsImage?: boolean;
};

const STORAGE_KEY = "chatMessages";
const FILTERS: { key: ChatType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "contribution", label: "Contributions" },
  { key: "payout", label: "Payouts" },
  { key: "penalty", label: "Penalties" },
];

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {
    /* storage unavailable */
  }
}

function timeLabel(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate();
  const month = d.toLocaleString("en-ZA", { month: "short" });
  const time = d.toLocaleString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} ${month} ${time}`;
}

function typeLabel(type: ChatType): string {
  switch (type) {
    case "contribution":
      return "Monthly contribution";
    case "payout":
      return "Payout";
    case "penalty":
      return "Penalty";
  }
}

function ChatPage() {
  const { t } = useT();
  const year = React.useMemo(() => new Date().getFullYear(), []);
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: members = [] } = useMembers(stokvel?.id);
  const { data: payments = [] } = usePayments(stokvel?.id, year);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [filter, setFilter] = React.useState<ChatType | "all">("all");
  const [note, setNote] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [msgType, setMsgType] = React.useState<ChatType>("contribution");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = React.useState<{
    name: string;
    size: number;
    type: string;
    blob: Blob | null;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [showAttachSheet, setShowAttachSheet] = React.useState(false);
  const [previewUrls, setPreviewUrls] = React.useState<Record<string, string>>({});
  const [storageText, setStorageText] = React.useState("");

  React.useEffect(() => {
    setMessages(loadMessages());
    setStorageText(storageLabel());
  }, []);

  // Load preview thumbnails for messages with proofs
  React.useEffect(() => {
    const proofs = messages.filter((m) => m.proofId);
    proofs.forEach(async (m) => {
      if (previewUrls[m.proofId!]) return;
      const blob = await getFile(m.proofId!);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrls((prev) => ({ ...prev, [m.proofId!]: url }));
      }
    });
  }, [messages, previewUrls]);

  // Sync proof review status from proofMeta back into chat messages
  React.useEffect(() => {
    const proofMeta = loadProofMeta();
    if (proofMeta.length === 0) return;
    let changed = false;
    const updated = messages.map((m) => {
      if (!m.proofId) return m;
      const meta = proofMeta.find((p) => p.id === m.proofId);
      if (!meta) return m;
      const newStatus: ChatStatus =
        meta.reviewStatus === "approved" ? "confirmed" : "pending";
      if (newStatus !== m.status) {
        changed = true;
        return { ...m, status: newStatus };
      }
      return m;
    });
    if (changed) {
      setMessages(updated);
      saveMessages(updated);
    }
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, filter]);

  // Seed system messages from payment data on first load
  React.useEffect(() => {
    if (!stokvel || members.length === 0 || payments.length === 0) return;
    const existing = loadMessages();
    if (existing.length > 0) return;
    const memberMap = new Map(members.map((m) => [m.id, m.name]));
    const seeded: ChatMessage[] = payments
      .filter((p) => memberMap.has(p.member_id))
      .map((p) => ({
        id: `seed-${p.id}`,
        memberName: memberMap.get(p.member_id)!,
        amount: p.amount,
        type: "contribution" as ChatType,
        status: "confirmed" as ChatStatus,
        note: `Month ${p.month} ${p.year}`,
        timestamp: new Date(p.year, p.month - 1, 15).getTime(),
        isSystem: true,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    if (seeded.length > 0) {
      setMessages(seeded);
      saveMessages(seeded);
    }
  }, [stokvel, members, payments]);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const s = computeSummary(stokvel, members, payments, year);
  const adminName = members[0]?.name ?? "Admin";

  async function handleFileSelect(file: File) {
    setShowAttachSheet(false);
    if (file.size > MAX_FILE_SIZE * 4) {
      alert("File too large. Maximum 20MB.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);

    // Fake progress animation
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + Math.random() * 20, 90));
    }, 150);

    try {
      const compressed = await compressImage(file);
      const isImage = compressed.type.startsWith("image/");
      setPendingFile({
        name: file.name,
        size: compressed.size,
        type: compressed.type,
        blob: compressed,
      });
      setUploadProgress(100);
      // Store the blob temporarily for sending
      (window as any).__pendingProofBlob = compressed;
      (window as any).__pendingProofIsImage = isImage;
    } catch {
      alert("Could not process this file.");
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setIsUploading(false), 300);
    }
  }

  function onPickSource(source: "camera" | "gallery" | "files") {
    if (fileInputRef.current) {
      if (source === "camera") {
        fileInputRef.current.setAttribute("capture", "environment");
      } else {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  }

  async function onDownloadProof(msg: ChatMessage) {
    if (!msg.proofId) return;
    const blob = await getFile(msg.proofId);
    if (blob) downloadBlob(blob, msg.proofFileName ?? "proof");
  }

  async function onSend() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      memberName: adminName,
      amount: amt,
      type: msgType,
      status: "pending",
      note: note.trim() || typeLabel(msgType),
      timestamp: Date.now(),
      isSystem: false,
    };

    // Attach proof if one is pending
    const blob = (window as any).__pendingProofBlob as Blob | undefined;
    const isImage = (window as any).__pendingProofIsImage as boolean | undefined;
    if (pendingFile && blob) {
      const proofId = `proof-${Date.now()}`;
      try {
        await saveFile(proofId, blob);
        msg.proofId = proofId;
        msg.proofFileName = pendingFile.name;
        msg.proofFileSize = pendingFile.size;
        msg.proofFileType = pendingFile.type;
        msg.proofIsImage = isImage;

        const meta: ProofMeta = {
          id: proofId,
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          fileType: pendingFile.type,
          isImage: !!isImage,
          uploadedAt: Date.now(),
          messageId: msg.id,
          memberName: adminName,
          amount: amt,
          reviewStatus: "pending",
        };
        addProofMeta(meta);
        setStorageText(storageLabel());
      } catch {
        alert("Could not save proof file.");
      }
    }

    const next = [...messages, msg];
    setMessages(next);
    saveMessages(next);
    setNote("");
    setAmount("");
    setPendingFile(null);
    delete (window as any).__pendingProofBlob;
    delete (window as any).__pendingProofIsImage;
  }

  const filtered =
    filter === "all" ? messages : messages.filter((m) => m.type === filter);

  return (
    <div className="min-h-screen bg-white pb-28">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 pt-5 pb-3 shadow-sm">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3">
            <a
              href="/payments"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
              aria-label="Back to payments"
            >
              <ArrowLeft className="h-5 w-5" />
            </a>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Transaction Chat</h1>
              <p className="text-xs text-gray-500">{stokvel.name}</p>
            </div>
            <div className="text-right text-[10px] text-gray-400">
              {storageText}
            </div>
          </div>

          {/* Balance + member */}
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Group Balance
              </div>
              <div className="text-xl font-bold tabular-nums text-gray-900">
                {randFormat(s.balance)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t("member")}
              </div>
              <div className="text-sm font-semibold text-gray-900">{adminName}</div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                  filter === f.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat timeline */}
      <div
        ref={scrollRef}
        className="mx-auto max-w-md space-y-3 overflow-y-auto px-4 py-4"
        style={{ maxHeight: "calc(100vh - 260px)", minHeight: "200px" }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-gray-400">
            <Receipt className="mb-2 h-10 w-10 text-gray-300" />
            No transactions yet. Add one below.
          </div>
        ) : (
          filtered.map((msg) => {
            const isSystem = msg.isSystem;
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  isSystem ? "justify-start" : "justify-end",
                )}
              >
                {isSystem && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                    {msg.memberName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                    isSystem
                      ? "rounded-bl-md bg-gray-50"
                      : "rounded-br-md bg-green-500 text-white",
                  )}
                >
                  {/* Proof thumbnail */}
                  {msg.proofId && (
                    <ProofThumb
                      msg={msg}
                      previewUrl={previewUrls[msg.proofId]}
                      isSystem={isSystem}
                      onDownload={() => onDownloadProof(msg)}
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        isSystem ? "text-gray-900" : "text-white",
                      )}
                    >
                      {randFormat(msg.amount)}
                    </span>
                    <Receipt
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSystem ? "text-gray-400" : "text-white/80",
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      "mt-0.5 text-xs font-medium",
                      isSystem ? "text-gray-600" : "text-white/90",
                    )}
                  >
                    {typeLabel(msg.type)} · {msg.note}
                  </div>
                  {msg.proofFileName && (
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-1 text-[10px]",
                        isSystem ? "text-gray-400" : "text-white/70",
                      )}
                    >
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate">{msg.proofFileName}</span>
                      <span>· {formatBytes(msg.proofFileSize ?? 0)}</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-[10px]",
                      isSystem ? "text-gray-400" : "text-white/70",
                    )}
                  >
                    <span>{timeLabel(msg.timestamp)}</span>
                    <span className="flex items-center gap-0.5">
                      {msg.status === "confirmed" ? (
                        <>
                          <Check className="h-3 w-3" /> Confirmed
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" /> Pending
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {!isSystem && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                    {msg.memberName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Upload progress bar */}
      {isUploading && (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-md px-4">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Uploading proof...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pending file preview */}
      {pendingFile && !isUploading && (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto max-w-md px-4">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-lg">
            {pendingFile.type.startsWith("image/") ? (
              <ImageIcon className="h-8 w-8 shrink-0 text-gray-400" />
            ) : (
              <FileText className="h-8 w-8 shrink-0 text-gray-400" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-gray-900">
                {pendingFile.name}
              </div>
              <div className="text-[10px] text-gray-400">
                {formatBytes(pendingFile.size)} - ready to send
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Attach bottom sheet */}
      {showAttachSheet && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/30"
          onClick={() => setShowAttachSheet(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Upload Proof</h3>
              <button
                type="button"
                onClick={() => setShowAttachSheet(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "camera", label: "Camera", icon: "📷" },
                { key: "gallery", label: "Gallery", icon: "🖼️" },
                { key: "files", label: "Files", icon: "📁" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onPickSource(opt.key as "camera" | "gallery" | "files")}
                  className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 py-4 text-xs font-semibold text-gray-700 transition-colors active:bg-gray-100"
                >
                  <span className="text-2xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] text-gray-400">
              Images (JPG, PNG), PDFs and screenshots. Max 5MB.
            </p>
          </div>
        </div>
      )}

      {/* Bottom sticky input */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="mx-auto max-w-md">
          {/* Type selector */}
          <div className="mb-2 flex gap-2">
            {(["contribution", "payout", "penalty"] as ChatType[]).map((ty) => (
              <button
                key={ty}
                type="button"
                onClick={() => setMsgType(ty)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors",
                  msgType === ty
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500",
                )}
              >
                {typeLabel(ty)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAttachSheet(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors active:bg-gray-200"
              aria-label="Upload proof"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="text"
              placeholder="Add transaction note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
            />
            <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 pl-3">
              <span className="text-sm font-semibold text-gray-400">R</span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
                className="w-16 bg-transparent px-1 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={onSend}
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition-opacity disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofThumb({
  msg,
  previewUrl,
  isSystem,
  onDownload,
}: {
  msg: ChatMessage;
  previewUrl: string | undefined;
  isSystem: boolean;
  onDownload: () => void;
}) {
  if (!msg.proofIsImage) {
    return (
      <div
        className={cn(
          "mb-2 flex items-center gap-2 rounded-lg border p-2",
          isSystem ? "border-gray-200 bg-white" : "border-white/20 bg-white/10",
        )}
      >
        <FileText
          className={cn("h-6 w-6", isSystem ? "text-gray-400" : "text-white/80")}
        />
        <span
          className={cn(
            "text-[10px] font-medium",
            isSystem ? "text-gray-500" : "text-white/80",
          )}
        >
          PDF Document
        </span>
        <button
          type="button"
          onClick={onDownload}
          className={cn(
            "ml-auto",
            isSystem ? "text-gray-400" : "text-white/80",
          )}
          aria-label="Download proof"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative mb-2 overflow-hidden rounded-lg">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={msg.proofFileName ?? "Proof"}
          className="h-32 w-full rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-lg bg-gray-100">
          <ImageIcon className="h-8 w-8 text-gray-300" />
        </div>
      )}
      <button
        type="button"
        onClick={onDownload}
        className={cn(
          "absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full shadow-sm",
          isSystem ? "bg-white/80 text-gray-600" : "bg-black/30 text-white",
        )}
        aria-label="Download proof"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
