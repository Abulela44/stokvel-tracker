import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Receipt, Send, Check, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Loading, PageTitle } from "@/components/kit";
import { useMembers, usePayments, useStokvel } from "@/lib/data";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { useT } from "@/lib/i18n";
import { computeSummary } from "@/lib/summary";
import { randFormat } from "@/lib/stokvel";
import { cn } from "@/lib/utils";

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

  React.useEffect(() => {
    setMessages(loadMessages());
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

  function onSend() {
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
    const next = [...messages, msg];
    setMessages(next);
    saveMessages(next);
    setNote("");
    setAmount("");
  }

  const filtered =
    filter === "all" ? messages : messages.filter((m) => m.type === filter);

  return (
    <div className="min-h-screen bg-white pb-28">
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
