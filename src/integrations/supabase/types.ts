export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          stokvel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          message: string
          stokvel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          stokvel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_stokvel_id_fkey"
            columns: ["stokvel_id"]
            isOneToOne: false
            referencedRelation: "stokvels"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reactions: {
        Row: {
          announcement_id: string
          created_at: string
          emoji: string
          id: string
          stokvel_id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          emoji: string
          id?: string
          stokvel_id: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          emoji?: string
          id?: string
          stokvel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reactions_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reactions_stokvel_id_fkey"
            columns: ["stokvel_id"]
            isOneToOne: false
            referencedRelation: "stokvels"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          attachment_path: string | null
          author_name: string
          created_at: string
          id: string
          message: string
          stokvel_id: string
          title: string
          updated_at: string
        }
        Insert: {
          attachment_path?: string | null
          author_name?: string
          created_at?: string
          id?: string
          message?: string
          stokvel_id: string
          title: string
          updated_at?: string
        }
        Update: {
          attachment_path?: string | null
          author_name?: string
          created_at?: string
          id?: string
          message?: string
          stokvel_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_stokvel_id_fkey"
            columns: ["stokvel_id"]
            isOneToOne: false
            referencedRelation: "stokvels"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_path: string
          file_type: string
          id: string
          name: string
          stokvel_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_path: string
          file_type?: string
          id?: string
          name: string
          stokvel_id: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_path?: string
          file_type?: string
          id?: string
          name?: string
          stokvel_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_stokvel_id_fkey"
            columns: ["stokvel_id"]
            isOneToOne: false
            referencedRelation: "stokvels"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          position: number
          stokvel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone?: string
          position?: number
          stokvel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          position?: number
          stokvel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_stokvel_id_fkey"
            columns: ["stokvel_id"]
            isOneToOne: false
            referencedRelation: "stokvels"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          file_path: string
          file_type: string
          id: string
          member_id: string | null
          payment_id: string | null
          status: string
          stokvel_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          file_path: string
          file_type?: string
          id?: string
          member_id?: string | null
          payment_id?: string | null
          status?: string
          stokvel_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_type?: string
          id?: string
          member_id?: string | null
          payment_id?: string | null
          status?: string
          stokvel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_stokvel_id_fkey"
            columns: ["stokvel_id"]
            isOneToOne: false
            referencedRelation: "stokvels"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          member_id: string
          month: number
          stokvel_id: string
          year: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          member_id: string
          month: number
          stokvel_id: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          member_id?: string
          month?: number
          stokvel_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_stokvel_id_fkey"
            columns: ["stokvel_id"]
            isOneToOne: false
            referencedRelation: "stokvels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          language: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          id: string
          language?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          phone?: string | null
        }
        Relationships: []
      }
      stokvels: {
        Row: {
          admin_id: string
          admin_phone: string
          created_at: string
          id: string
          meeting_day: number
          monthly_contribution: number
          name: string
          tier: string
        }
        Insert: {
          admin_id: string
          admin_phone?: string
          created_at?: string
          id?: string
          meeting_day?: number
          monthly_contribution?: number
          name: string
          tier?: string
        }
        Update: {
          admin_id?: string
          admin_phone?: string
          created_at?: string
          id?: string
          meeting_day?: number
          monthly_contribution?: number
          name?: string
          tier?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
