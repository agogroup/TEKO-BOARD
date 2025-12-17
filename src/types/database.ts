export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TekoAssignmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Database {
  public: {
    Tables: {
      teko_workers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          company_name: string | null;
          skills: string[] | null;
          hourly_rate: number | null;
          daily_rate: number | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          company_name?: string | null;
          skills?: string[] | null;
          hourly_rate?: number | null;
          daily_rate?: number | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          company_name?: string | null;
          skills?: string[] | null;
          hourly_rate?: number | null;
          daily_rate?: number | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      teko_sites: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          client_id: string | null;
          project_id: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          client_id?: string | null;
          project_id?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          client_id?: string | null;
          project_id?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      teko_assignments: {
        Row: {
          id: string;
          worker_id: string;
          site_id: string;
          date: string;
          start_time: string | null;
          end_time: string | null;
          status: TekoAssignmentStatus;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          site_id: string;
          date: string;
          start_time?: string | null;
          end_time?: string | null;
          status?: TekoAssignmentStatus;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          site_id?: string;
          date?: string;
          start_time?: string | null;
          end_time?: string | null;
          status?: TekoAssignmentStatus;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      teko_contacts: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string | null;
          phone: string | null;
          email: string | null;
          category: string | null;
          address: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name?: string | null;
          phone?: string | null;
          email?: string | null;
          category?: string | null;
          address?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_name?: string | null;
          phone?: string | null;
          email?: string | null;
          category?: string | null;
          address?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      teko_daily_schedule: {
        Row: {
          assignment_id: string;
          date: string;
          start_time: string | null;
          end_time: string | null;
          status: TekoAssignmentStatus;
          worker_id: string;
          worker_name: string;
          worker_phone: string | null;
          site_id: string;
          site_name: string;
          site_address: string | null;
          project_id: string | null;
          project_name: string | null;
          client_id: string | null;
          client_name: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      teko_assignment_status: TekoAssignmentStatus;
    };
  };
}

// 便利な型エイリアス
export type TekoWorker = Database["public"]["Tables"]["teko_workers"]["Row"];
export type TekoWorkerInsert = Database["public"]["Tables"]["teko_workers"]["Insert"];
export type TekoWorkerUpdate = Database["public"]["Tables"]["teko_workers"]["Update"];

export type TekoSite = Database["public"]["Tables"]["teko_sites"]["Row"];
export type TekoSiteInsert = Database["public"]["Tables"]["teko_sites"]["Insert"];
export type TekoSiteUpdate = Database["public"]["Tables"]["teko_sites"]["Update"];

export type TekoAssignment = Database["public"]["Tables"]["teko_assignments"]["Row"];
export type TekoAssignmentInsert = Database["public"]["Tables"]["teko_assignments"]["Insert"];
export type TekoAssignmentUpdate = Database["public"]["Tables"]["teko_assignments"]["Update"];

export type TekoContact = Database["public"]["Tables"]["teko_contacts"]["Row"];
export type TekoContactInsert = Database["public"]["Tables"]["teko_contacts"]["Insert"];
export type TekoContactUpdate = Database["public"]["Tables"]["teko_contacts"]["Update"];

export type TekoDailySchedule = Database["public"]["Views"]["teko_daily_schedule"]["Row"];
