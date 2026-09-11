import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, Pencil, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Empty, Field, Input, Loading, PageTitle } from "@/components/kit";
import { useT } from "@/lib/i18n";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import { waLink } from "@/lib/stokvel";
import {
  REACTIONS,
  openFile,
  useAnnouncements,
  useDeleteAnnouncement,
  useReactions,
  useSaveAnnouncement,
  useToggleReaction,
  type Announcement,
} from "@/lib/community";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({
    meta: [
      { title: "Announcement board - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Post stokvel news, share it on WhatsApp and see member reactions.",
      },
      { property: "og:title", content: "Announcement board - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Share meeting changes and news with your stokvel members.",
      },
    ],
  }),
  component: Announcements,
});

function Announcements() {
  const { t } = useT();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: list = [] } = useAnnouncements(stokvel?.id);
  const { data: reactions = [] } = useReactions(stokvel?.id);
  const save = useSaveAnnouncement(stokvel?.id);
  const del = useDeleteAnnouncement(stokvel?.id);
  const toggle = useToggleReaction(stokvel?.id);

  const [userId, setUserId] = React.useState<string>("");
  const [editing, setEditing] = React.useState<Announcement | null>(null);
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const reset = () => {
    setEditing(null);
    setTitle("");
    setMessage("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    save.mutate(
      {
        ...(editing ? { id: editing.id } : {}),
        title: title.trim(),
        message: message.trim(),
        file: fileRef.current?.files?.[0] ?? null,
        authorName: "Admin",
      },
      {
        onSuccess: () => {
          toast.success(t("savedChanges"));
          reset();
        },
        onError: () => toast.error(t("somethingWrong")),
      },
    );
  };

  const view = async (path: string) => {
    try {
      const url = await openFile(path);
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error(t("somethingWrong"));
    }
  };

  return (
    <AppShell>
      <PageTitle subtitle={t("announcementsHint")}>{t("announcementsTitle")}</PageTitle>

      <Card>
        <h2 className="mb-3 font-bold">{editing ? t("edit") : t("newAnnouncement")}</h2>
        <form className="space-y-3" onSubmit={submit}>
          <Field label={t("annTitle")}>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Monthly meeting moved to Saturday"
              required
            />
          </Field>
          <Field label={t("annMessage")}>
            <textarea
              className="min-h-24 w-full rounded-xl border border-border bg-input px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>
          <Field label={t("attachment")}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="w-full text-sm"
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={save.isPending}>
              {save.isPending ? t("posting") : t("post")}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" onClick={reset}>
                {t("cancel")}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="mt-4 space-y-3">
        {list.length === 0 ? <Empty>{t("noAnnouncements")}</Empty> : null}
        {list.map((a) => {
          const mine = reactions.filter((r) => r.announcement_id === a.id && r.user_id === userId);
          const total = reactions.filter((r) => r.announcement_id === a.id).length;
          return (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold leading-tight">{a.title}</h3>
                <div className="flex shrink-0 gap-1">
                  <button
                    aria-label={t("edit")}
                    className="min-h-11 min-w-11 text-muted-foreground"
                    onClick={() => {
                      setEditing(a);
                      setTitle(a.title);
                      setMessage(a.message);
                    }}
                  >
                    <Pencil className="mx-auto h-5 w-5" aria-hidden />
                  </button>
                  <button
                    aria-label={t("delete")}
                    className="min-h-11 min-w-11 text-destructive"
                    onClick={() => {
                      if (window.confirm(t("deleteConfirm"))) del.mutate(a);
                    }}
                  >
                    <Trash2 className="mx-auto h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>
              {a.message ? <p className="mt-1 whitespace-pre-wrap text-sm">{a.message}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {t("postedBy")} {a.author_name} - {new Date(a.created_at).toLocaleDateString("en-ZA")}
              </p>

              {a.attachment_path ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => void view(a.attachment_path!)}
                >
                  <Paperclip className="h-4 w-4" aria-hidden /> {t("viewAttachment")}
                </Button>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {REACTIONS.map((emoji) => {
                  const existing = mine.find((r) => r.emoji === emoji);
                  const count = reactions.filter(
                    (r) => r.announcement_id === a.id && r.emoji === emoji,
                  ).length;
                  return (
                    <button
                      key={emoji}
                      onClick={() =>
                        toggle.mutate({
                          announcementId: a.id,
                          emoji,
                          ...(existing ? { existingId: existing.id } : {}),
                        })
                      }
                      className={`min-h-11 rounded-xl border px-3 text-base ${
                        existing ? "border-primary text-primary" : "border-border"
                      }`}
                    >
                      {emoji} {count > 0 ? count : ""}
                    </button>
                  );
                })}
                <span className="ml-auto text-xs text-muted-foreground">{total}</span>
              </div>

              <a
                href={waLink(
                  "",
                  t("waAnnouncement", {
                    stokvel: stokvel.name,
                    title: a.title,
                    message: a.message,
                  }),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-primary text-sm font-semibold text-primary"
              >
                <Send className="h-4 w-4" aria-hidden /> {t("shareWhatsapp")}
              </a>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
