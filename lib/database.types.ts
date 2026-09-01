// Supabase スキーマの型定義
// クラウドプロジェクト接続後は `supabase gen types typescript --linked > lib/database.types.ts`
// で再生成できる（本ファイルは migrations と同じ構造を手書きしたもの）

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserStatus = "away" | "meeting" | "remote" | "out";
export type CheckOutReason = "manual" | "moved" | "auto_reset" | "takeover";

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: { key: string; value: string };
        Insert: { key: string; value: string };
        Update: { key?: string; value?: string };
        Relationships: [];
      };
      floors: {
        Row: {
          id: string;
          name: string;
          image_path: string;
          image_width: number;
          image_height: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          image_path: string;
          image_width: number;
          image_height: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          image_path?: string;
          image_width?: number;
          image_height?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      seats: {
        Row: {
          id: string;
          floor_id: string;
          label: string;
          x: number;
          y: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          floor_id: string;
          label: string;
          x: number;
          y: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          floor_id?: string;
          label?: string;
          x?: number;
          y?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string;
          department: string | null;
          avatar_url: string | null;
          is_admin: boolean;
          status: UserStatus | null;
          status_changed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          department?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          status?: UserStatus | null;
          status_changed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          department?: string | null;
          avatar_url?: string | null;
          is_admin?: boolean;
          status?: UserStatus | null;
          status_changed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      seat_sessions: {
        Row: {
          id: string;
          seat_id: string;
          user_id: string;
          checked_in_at: string;
          checked_out_at: string | null;
          check_out_reason: CheckOutReason | null;
        };
        Insert: {
          id?: string;
          seat_id: string;
          user_id: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
          check_out_reason?: CheckOutReason | null;
        };
        Update: {
          id?: string;
          seat_id?: string;
          user_id?: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
          check_out_reason?: CheckOutReason | null;
        };
        Relationships: [];
      };
    };
    Views: {
      attendance_days: {
        Row: {
          day: string;
          user_id: string;
          display_name: string;
          department: string | null;
        };
        Relationships: [];
      };
      seat_usage_days: {
        Row: {
          day: string;
          seat_id: string;
          label: string;
          floor_id: string;
          floor_name: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_in: {
        Args: { p_seat_id: string; p_force?: boolean };
        Returns: Json;
      };
      check_out: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Floor = Database["public"]["Tables"]["floors"]["Row"];
export type Seat = Database["public"]["Tables"]["seats"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SeatSession = Database["public"]["Tables"]["seat_sessions"]["Row"];

export type CheckInResult =
  | { status: "ok" }
  | { status: "already_here" }
  | { status: "occupied"; occupant: string }
  | { status: "conflict" }
  | { status: "invalid_seat" };
