import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Stokvel = {
  id: string;
  admin_id: string;
  name: string;
  monthly_contribution: number;
  meeting_day: number;
  admin_phone: string;
  tier: string;
};

export type Member = {
  id: string;
  stokvel_id: string;
  name: string;
  phone: string;
  position: number;
};

export type Payment = {
  id: string;
  member_id: string;
  year: number;
  month: number;
  amount: number;
};

export function useStokvel() {
  return useQuery({
    queryKey: ["stokvel"],
    queryFn: async (): Promise<Stokvel | null> => {
      const { data, error } = await supabase
        .from("stokvels")
        .select("id, admin_id, name, monthly_contribution, meeting_day, admin_phone, tier")
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      return (data?.[0] as Stokvel) ?? null;
    },
  });
}

export function useMembers(stokvelId: string | undefined) {
  return useQuery({
    queryKey: ["members", stokvelId],
    enabled: !!stokvelId,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from("members")
        .select("id, stokvel_id, name, phone, position")
        .eq("stokvel_id", stokvelId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });
}

export function usePayments(stokvelId: string | undefined, year: number) {
  return useQuery({
    queryKey: ["payments", stokvelId, year],
    enabled: !!stokvelId,
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, member_id, year, month, amount")
        .eq("stokvel_id", stokvelId!)
        .eq("year", year);
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
  });
}

export function useTogglePayment(stokvelId: string | undefined, year: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      memberId: string;
      month: number;
      existingId: string | undefined;
      amount: number;
    }) => {
      if (input.existingId) {
        const { error } = await supabase.from("payments").delete().eq("id", input.existingId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("payments").insert({
        stokvel_id: stokvelId!,

        member_id: input.memberId,
        year,
        month: input.month,
        amount: input.amount,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments", stokvelId, year] }),
  });
}

export function useAddMember(stokvelId: string | undefined, nextPosition: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; phone: string }) => {
      const { error } = await supabase.from("members").insert({
        stokvel_id: stokvelId!,
        name: input.name,
        phone: input.phone,
        position: nextPosition,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", stokvelId] }),
  });
}

export function useRemoveMember(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", stokvelId] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useReorderMembers(stokvelId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ordered: Member[]) => {
      await Promise.all(
        ordered.map((m, i) =>
          supabase
            .from("members")
            .update({ position: i + 1 })
            .eq("id", m.id),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members", stokvelId] }),
  });
}

export function useUpdateStokvel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & Partial<Stokvel>) => {
      const { id, ...fields } = input;
      const { error } = await supabase.from("stokvels").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stokvel"] }),
  });
}
