import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Trash2,
  Eye,
  Download,
  Upload,
  X,
  Check,
  AlertCircle,
  Loader2,
  Paperclip,
  FileImage,
  FileType,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Empty, Field, Input, Loading, PageTitle } from "@/components/kit";
import { useT, type Key } from "@/lib/i18n";
import { useRequireStokvel } from "@/lib/useRequireStokvel";
import {
  ACCEPTED_UPLOADS,
  DOCS_MAX_UPLOAD_BYTES,
  DOCS_ACCEPTED_EXTS,
  checkDocFile,
  getDocSignedUrl,
  downloadDocFile,
  prettyBytes,
  useAddDocument,
  useDeleteDocument,
  useDocuments,
} from "@/lib/community";

const DOC_CATEGORIES: { value: string; key: Key }[] = [
  { value: "constitution", key: "docConstitution" },
  { value: "minutes", key: "docMinutes" },
  { value: "rules", key: "docRules" },
  { value: "statement", key: "docStatement" },
  { value: "notice", key: "docNotice" },
  { value: "other", key: "docOther" },
];

type UploadState = "idle" | "uploading" | "success" | "error";

function fileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.includes("pdf") || fileType.includes("word") || fileType.includes("document"))
    return FileType;
  return FileText;
}

function fileTypeLabel(fileType: string, fileName: string): string {
  if (fileType.startsWith("image/")) return "Image";
  if (fileType.includes("pdf")) return "PDF";
  if (fileType.includes("word") || fileType.includes("document")) return "Document";
  const ext = fileName.split(".").pop()?.toUpperCase() ?? "File";
  return ext;
}

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Stokvel documents - Stokvel Tracker SA" },
      {
        name: "description",
        content:
          "Keep your constitution, meeting minutes, rules and statements in one private place.",
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
  const [category, setCategory] = React.useState("constitution");
  const [pickedFile, setPickedFile] = React.useState<File | null>(null);
  const [uploadState, setUploadState] = React.useState<UploadState>("idle");
  const [uploadError, setUploadError] = React.useState<string>("");
  const [progress, setProgress] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);

  if (isLoading || !stokvel) {
    return (
      <AppShell>
        <Loading label={t("loading")} />
      </AppShell>
    );
  }

  const resetForm = () => {
    setPickedFile(null);
    setName("");
    setUploadState("idle");
    setUploadError("");
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const err = checkDocFile(file);
    if (err === "too-big") {
      toast.error(`File too large. Maximum size is ${prettyBytes(DOCS_MAX_UPLOAD_BYTES)}.`);
      resetForm();
      return;
    }
    if (err === "bad-type") {
      toast.error(`Unsupported file type. Use: ${DOCS_ACCEPTED_EXTS.join(", ")}`);
      resetForm();
      return;
    }

    setPickedFile(file);
    setUploadState("idle");
    setUploadError("");
    if (!name.trim()) {
      setName(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedFile) {
      toast.error("Please choose a file first.");
      return;
    }

    setUploadState("uploading");
    setProgress(0);
    setUploadError("");

    // Fake progress for visual feedback while the real upload happens
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 85));
    }, 200);

    try {
      const label = name.trim() || pickedFile.name;
      await add.mutateAsync({
        name: label,
        category,
        file: pickedFile,
        uploadedBy: "Admin",
      });
      setProgress(100);
      setUploadState("success");
      toast.success("Document uploaded successfully.");
      setTimeout(() => resetForm(), 1500);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed. Please try again.";
      setUploadError(msg);
      setUploadState("error");
      toast.error(msg);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const viewDoc = async (d: (typeof docs)[number]) => {
    try {
      const path = d.storage_path || d.file_path;
      const url = await getDocSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not open file.",
      );
    }
  };

  const downloadDoc = async (d: (typeof docs)[number]) => {
    try {
      const path = d.storage_path || d.file_path;
      await downloadDocFile(path, d.name);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not download file.",
      );
    }
  };

  const deleteDoc = (d: (typeof docs)[number]) => {
    if (!window.confirm(`Delete "${d.name}"? This cannot be undone.`)) return;
    del.mutate(d, {
      onSuccess: () => toast.success("Document deleted."),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Could not delete."),
    });
  };

  return (
    <AppShell>
      <PageTitle subtitle={t("documentsHint")}>{t("documentsTitle")}</PageTitle>

      {/* Upload card */}
      <Card>
        <h2 className="mb-3 font-bold">{t("uploadDocument")}</h2>
        <form className="space-y-3" onSubmit={submit}>
          <Field label={t("docName")}>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Constitution 2026"
              disabled={uploadState === "uploading"}
            />
          </Field>

          <Field label={t("docType")}>
            <select
              className="tap-target w-full rounded-xl border border-border bg-input px-4 text-base text-foreground focus:border-primary focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploadState === "uploading"}
            >
              {DOC_CATEGORIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {t(d.key)}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={t("chooseFile")}
            hint={`Supported: PDF, JPG, PNG, DOC, DOCX. Max ${prettyBytes(DOCS_MAX_UPLOAD_BYTES)}.`}
          >
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_UPLOADS}
              onChange={onPick}
              disabled={uploadState === "uploading"}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploadState === "uploading"}
                className="flex items-center gap-2"
              >
                <Paperclip className="h-4 w-4" />
                {pickedFile ? "Change file" : "Choose file"}
              </Button>
              {pickedFile && (
                <span className="truncate text-sm text-muted-foreground">
                  {pickedFile.name}
                </span>
              )}
            </div>
          </Field>

          {/* File preview card */}
          {pickedFile && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-3">
                {pickedFile.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(pickedFile)}
                    alt={pickedFile.name}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-7 w-7 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{pickedFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {fileTypeLabel(pickedFile.type, pickedFile.name)} ·{" "}
                    {prettyBytes(pickedFile.size)}
                  </div>
                </div>
                {uploadState !== "uploading" && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {uploadState === "uploading" && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("uploading")}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success state */}
              {uploadState === "success" && (
                <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <Check className="h-4 w-4" />
                  Upload successful
                </div>
              )}

              {/* Error state */}
              {uploadState === "error" && (
                <div className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!pickedFile || uploadState === "uploading"}
          >
            {uploadState === "uploading" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("uploading")}
              </span>
            ) : uploadState === "success" ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Uploaded
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t("upload")}
              </span>
            )}
          </Button>
        </form>
      </Card>

      {/* Document list */}
      <div className="mt-4 space-y-3">
        {docs.length === 0 ? <Empty>{t("noDocuments")}</Empty> : null}
        {docs.map((d) => {
          const Icon = fileIcon(d.file_type);
          const catLabel = t(
            (DOC_CATEGORIES.find((x) => x.value === d.category)?.key ??
              DOC_CATEGORIES.find((x) => x.value === d.doc_type)?.key ??
              "docOther") as Key,
          );
          return (
            <Card key={d.id} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{d.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {catLabel} ·{" "}
                  {new Date(d.created_at).toLocaleDateString("en-ZA")} ·{" "}
                  {d.uploaded_by}
                  {d.file_size ? ` · ${prettyBytes(d.file_size)}` : ""}
                </div>
              </div>
              <button
                aria-label={t("view")}
                className="min-h-11 min-w-11 text-primary"
                onClick={() => void viewDoc(d)}
              >
                <Eye className="mx-auto h-5 w-5" aria-hidden />
              </button>
              <button
                aria-label="Download"
                className="min-h-11 min-w-11 text-muted-foreground"
                onClick={() => void downloadDoc(d)}
              >
                <Download className="mx-auto h-5 w-5" aria-hidden />
              </button>
              <button
                aria-label={t("delete")}
                className="min-h-11 min-w-11 text-destructive"
                onClick={() => deleteDoc(d)}
              >
                <Trash2 className="mx-auto h-5 w-5" aria-hidden />
              </button>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
