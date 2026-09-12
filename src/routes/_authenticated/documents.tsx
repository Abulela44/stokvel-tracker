import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Empty, Field, Input, Loading, PageTitle } from "@/components/kit";
import { useT, type Key } from "@/lib/i18n";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import {
  ACCEPTED_UPLOADS,
  checkUploadFile,
  MAX_UPLOAD_BYTES,
  openFile,
  prettyBytes,
  useAddDocument,
  useDeleteDocument,
  useDocuments,
} from "@/lib/community";


const DOC_TYPES: { value: string; key: Key }[] = [
  { value: "constitution", key: "docConstitution" },
  { value: "minutes", key: "docMinutes" },
  { value: "rules", key: "docRules" },
  { value: "statement", key: "docStatement" },
  { value: "notice", key: "docNotice" },
  { value: "other", key: "docOther" },
];

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Stokvel documents - Stokvel Tracker SA" },
      {
        name: "description",
        content: "Keep your constitution, meeting minutes, rules and statements in one private place.",
      },
      { property: "og:title", content: "Stokvel documents - Stokvel Tracker SA" },
      {
        property: "og:description",
        content: "Private document storage for your stokvel paperwork.",
      },
    ],
  }),
  component: Documents,
});

function Documents() {
  const { t } = useT();
  const { data: stokvel, isLoading } = useRequireStokvel();
  const { data: docs = [] } = useDocuments(stokvel?.id);
  const add = useAddDocument(stokvel?.id);
  const del = useDeleteDocument(stokvel?.id);

  const [name, setName] = React.useState("");
  const [docType, setDocType] = React.useState("constitution");
  const [picked, setPicked] = React.useState<File[]>([]);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const clearFiles = () => {
    setPicked([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const tooBig = files.find((f) => checkUploadFile(f) === "too-big");
    if (tooBig) {
      toast.error(t("fileTooBig", { max: prettyBytes(MAX_UPLOAD_BYTES) }));
      clearFiles();
      return;
    }
    setPicked(files);
    if (!name.trim() && files[0]) {
      setName(files[0].name.replace(/\.[^.]+$/, ""));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (picked.length === 0) {
      toast.error(t("chooseFile"));
      return;
    }
    setBusy(true);
    let done = 0;
    try {
      for (const [i, file] of picked.entries()) {
        const label =
          picked.length === 1
            ? name.trim() || file.name
            : name.trim()
              ? `${name.trim()} ${i + 1}`
              : file.name;
        await add.mutateAsync({ name: label, docType, file, uploadedBy: "Admin" });
        done += 1;
      }
      toast.success(t("uploadedCount", { count: done }));
      setName("");
      clearFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
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
      <PageTitle subtitle={t("documentsHint")}>{t("documentsTitle")}</PageTitle>

      <Card>
        <h2 className="mb-3 font-bold">{t("uploadDocument")}</h2>
        <form className="space-y-3" onSubmit={submit}>
          <Field label={t("docName")}>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Constitution 2026"
            />
          </Field>
          <Field label={t("docType")}>
            <select
              className="tap-target w-full rounded-xl border border-border bg-input px-4 text-base text-foreground focus:border-primary focus:outline-none"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {t(d.key)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("chooseFile")}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="w-full text-sm"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={add.isPending}>
            {add.isPending ? t("uploading") : t("upload")}
          </Button>
        </form>
      </Card>

      <div className="mt-4 space-y-3">
        {docs.length === 0 ? <Empty>{t("noDocuments")}</Empty> : null}
        {docs.map((d) => (
          <Card key={d.id} className="flex items-center gap-3">
            <FileText className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{d.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {t((DOC_TYPES.find((x) => x.value === d.doc_type)?.key ?? "docOther") as Key)} -{" "}
                {new Date(d.created_at).toLocaleDateString("en-ZA")} - {d.uploaded_by}
              </div>
            </div>
            <button
              aria-label={t("view")}
              className="min-h-11 min-w-11 text-primary"
              onClick={() => void view(d.file_path)}
            >
              <Eye className="mx-auto h-5 w-5" aria-hidden />
            </button>
            <button
              aria-label={t("delete")}
              className="min-h-11 min-w-11 text-destructive"
              onClick={() => {
                if (window.confirm(t("deleteConfirm"))) del.mutate(d);
              }}
            >
              <Trash2 className="mx-auto h-5 w-5" aria-hidden />
            </button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
