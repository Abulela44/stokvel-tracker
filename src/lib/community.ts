import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "stokvel-files";
export const REACTIONS = ["👍", "❤️", "😂", "😮"] as const;
export type ProofStatus = "pending" | "approved" | "rejected";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const ACCEPTED_UPLOADS =
  "image/*,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";

export function prettyBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns an error string when the file cannot be uploaded, otherwise null. */
export function checkUploadFile(file: File | null | undefined): string | null {
  if (!file) return "no-file";
  if (file.size === 0) return "empty-file";
  if (file.size > MAX_UPLOAD_BYTES) return "too-big";
  return null;
}


export type Announcement = {
  id: string;
  stokvel_id: string;
  title: string;
  message: string;
  attachment_path: string | null;
  author_name: string;
  created_at: string;
};

export type Reaction = {
  id: string;
  announcement_id: string;
  user_id: string;
  emoji: string;
};

export type Proof = {
  id: string;
  stokvel_id: string;
  member_id: string | null;
  payment_id: string | null;
  file_path: string;
  file_type: string;
  amount: number | null;
  description: string | null;
  status: string;
  created_at: string;
};

export type StokvelDocument = {
  id: string;
  stokvel_id: string;
  name: string;
  doc_type: string;
  file_path: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
};

export type ActivityItem = {
  id: string;
  kind: string;
  message: string;
  created_at: string;
};

/* ---------- files ---------- */

export async function uploadFile(stokvelId: string, folder: string, file: File) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${stokvelId}/${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return { path, type: file.type || "" };
}

export async function openFile(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

async function removeFile(path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

/* ---------- activity ---------- */

export async function logActivity(stokvelId: string, kind: string, message: string) {
  await supabase.from("activity").insert({ stokvel_id: stokvelId, kind, message });
}

export function useActivity(stokvelId: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ["activity", stokvelId, limit],
    enabled: !!stokvelId,
    queryFn: async (): Promise<ActivityItem[]> => {
      const { data, error } = await supabase
        .from("activity")
        .select("id, kind, message, created_at")
        .eq("stokvel_id", stokvelId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ActivityItem[];
    },
  });
}

/* ---------- announcements ---------- */

export function useAnnouncements(stokvelId: string | undefined) {
  return useQuery({
    queryKey: ["announcements", stokvelId],
    enabled: !!stokvelId,
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, stokvel_id, title, message, attachment_path, author_name, created_at")
        .eq("stokvel_id", stokvelId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
  });
}

export function useReactions(stokvelId: string | undefined) {
  return useQuery({
    queryKey: ["reactions", stokvelId],
    enabled: !!stokvelId,
    queryFn: async (): Promise<Reaction[]> => {
      const { data, error } = await supabase
        .from("announcement_reactions")
        .select("id, announcement_id, user_id, emoji")
        .eq("stokvel_id", stokvelId!);
      if (error) throw error;
      return (data ?? []) as Reaction[];
    },
  });
}

export function useToggleReaction(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { announcementId: string; emoji: string; existingId?: string }) => {
      if (input.existingId) {
        const { error } = await supabase
          .from("announcement_reactions")
          .delete()
          .eq("id", input.existingId);
        if (error) throw error;
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("announcement_reactions").insert({
        announcement_id: input.announcementId,
        stokvel_id: stokvelId!,
        user_id: auth.user!.id,
        emoji: input.emoji,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reactions", stokvelId] }),
  });
}

export function useSaveAnnouncement(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      title: string;
      message: string;
      file?: File | null;
      authorName: string;
    }) => {
      let attachment: string | null | undefined;
      let _type = "";
      if (input.file) {
        const up = await uploadFile(stokvelId!, "announcements", input.file);
        attachment = up.path;
        _type = up.type;
      }
      if (input.id) {
        const fields: { title: string; message: string; attachment_path?: string } = {
          title: input.title,
          message: input.message,
        };
        if (attachment) fields.attachment_path = attachment;
        const { error } = await supabase.from("announcements").update(fields).eq("id", input.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("announcements").insert({
        stokvel_id: stokvelId!,
        title: input.title,
        message: input.message,
        attachment_path: attachment ?? null,
        author_name: input.authorName,
      });
      if (error) throw error;
      await logActivity(stokvelId!, "announcement", `New announcement posted: ${input.title}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements", stokvelId] });
      qc.invalidateQueries({ queryKey: ["activity", stokvelId] });
    },
  });
}

export function useDeleteAnnouncement(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Announcement) => {
      await removeFile(a.attachment_path);
      const { error } = await supabase.from("announcements").delete().eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements", stokvelId] });
      qc.invalidateQueries({ queryKey: ["reactions", stokvelId] });
    },
  });
}

/* ---------- payment proof ---------- */

export function useProofs(stokvelId: string | undefined) {
  return useQuery({
    queryKey: ["proofs", stokvelId],
    enabled: !!stokvelId,
    queryFn: async (): Promise<Proof[]> => {
      const { data, error } = await supabase
        .from("payment_proofs")
        .select(
          "id, stokvel_id, member_id, payment_id, file_path, file_type, amount, description, status, created_at",
        )
        .eq("stokvel_id", stokvelId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Proof[];
    },
  });
}

export async function uploadProof(stokvelId: string, file: File) {
  return uploadFile(stokvelId, "proofs", file);
}

/** Proof files live in a private bucket, so always hand out a short-lived signed link. */
export async function getProofUrl(path: string): Promise<string> {
  return openFile(path);
}


export function useAddProof(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      memberId: string;
      memberName: string;
      amount: number | null;
      description: string;
      file: File;
    }) => {
      const up = await uploadProof(stokvelId!, input.file);
      const { error } = await supabase.from("payment_proofs").insert({
        stokvel_id: stokvelId!,
        member_id: input.memberId || null,
        file_path: up.path,
        file_type: up.type,
        amount: input.amount,
        description: input.description || null,
        status: "pending",
      });
      if (error) throw error;
      await logActivity(stokvelId!, "proof", `${input.memberName} uploaded payment proof.`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proofs", stokvelId] });
      qc.invalidateQueries({ queryKey: ["activity", stokvelId] });
    },
  });
}

export function useUpdateProof(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: ProofStatus;
      paymentId?: string | null;
      note?: string;
    }) => {
      const fields: { status?: string; payment_id?: string | null } = {};
      if (input.status) fields.status = input.status;
      if (input.paymentId !== undefined) fields.payment_id = input.paymentId;
      const { error } = await supabase.from("payment_proofs").update(fields).eq("id", input.id);
      if (error) throw error;
      if (input.note) await logActivity(stokvelId!, "proof", input.note);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["proofs", stokvelId] });
      qc.invalidateQueries({ queryKey: ["activity", stokvelId] });
    },
  });
}

export function useDeleteProof(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Proof) => {
      await supabase.storage.from(PROOF_BUCKET).remove([p.file_path]);
      const { error } = await supabase.from("payment_proofs").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["proofs", stokvelId] }),
  });
}

/* ---------- documents ---------- */

export function useDocuments(stokvelId: string | undefined) {
  return useQuery({
    queryKey: ["documents", stokvelId],
    enabled: !!stokvelId,
    queryFn: async (): Promise<StokvelDocument[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, stokvel_id, name, doc_type, file_path, file_type, uploaded_by, created_at")
        .eq("stokvel_id", stokvelId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StokvelDocument[];
    },
  });
}

export function useAddDocument(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      docType: string;
      file: File;
      uploadedBy: string;
    }) => {
      const up = await uploadFile(stokvelId!, "documents", input.file);
      const { error } = await supabase.from("documents").insert({
        stokvel_id: stokvelId!,
        name: input.name || input.file.name,
        doc_type: input.docType,
        file_path: up.path,
        file_type: up.type,
        uploaded_by: input.uploadedBy,
      });
      if (error) throw error;
      await logActivity(stokvelId!, "document", `New document uploaded: ${input.name || input.file.name}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", stokvelId] });
      qc.invalidateQueries({ queryKey: ["activity", stokvelId] });
    },
  });
}

export function useDeleteDocument(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: StokvelDocument) => {
      await removeFile(d.file_path);
      const { error } = await supabase.from("documents").delete().eq("id", d.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", stokvelId] }),
  });
}
