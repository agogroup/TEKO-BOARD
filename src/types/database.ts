export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// AGORA共有テーブルの型定義
export type ProjectType =
  | "signage"
  | "interior"
  | "digital"
  | "electrical"
  | "other";

export type ProjectStatus =
  | "inquiry"
  | "estimating"
  | "contracted"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export type WorkerType = "internal" | "partner";

export interface Project {
  id: string;
  project_code: string;
  name: string;
  client_id: string | null;
  type: ProjectType;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "member" | "partner";
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  user_id: string;
  partner_id: string | null;
  worker_type: WorkerType;
  display_name: string | null;
  skills: string[] | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  certifications: string[] | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TekoAssignmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<User>;
      };
      partners: {
        Row: Partner;
        Insert: Omit<
          Partner,
          "id" | "created_at" | "updated_at" | "is_active"
        > & {
          id?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Partner>;
      };
      workers: {
        Row: Worker;
        Insert: {
          id?: string;
          user_id: string;
          partner_id?: string | null;
          worker_type: WorkerType;
          display_name?: string | null;
          skills?: string[] | null;
          hourly_rate?: number | null;
          daily_rate?: number | null;
          certifications?: string[] | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Worker>;
      };
      teko_assignments: {
        Row: {
          id: string;
          worker_id: string;
          project_id: string;
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
          project_id: string;
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
          project_id?: string;
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
      // 旧テーブル（後方互換性のため残す）
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
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      teko_assignment_status: TekoAssignmentStatus;
      worker_type: WorkerType;
    };
  };
}

// 便利な型エイリアス
export type WorkerRow = Database["public"]["Tables"]["workers"]["Row"];
export type WorkerInsert = Database["public"]["Tables"]["workers"]["Insert"];
export type WorkerUpdate = Database["public"]["Tables"]["workers"]["Update"];

export type PartnerRow = Database["public"]["Tables"]["partners"]["Row"];
export type PartnerInsert = Database["public"]["Tables"]["partners"]["Insert"];
export type PartnerUpdate = Database["public"]["Tables"]["partners"]["Update"];

export type TekoAssignment =
  Database["public"]["Tables"]["teko_assignments"]["Row"];
export type TekoAssignmentInsert =
  Database["public"]["Tables"]["teko_assignments"]["Insert"];
export type TekoAssignmentUpdate =
  Database["public"]["Tables"]["teko_assignments"]["Update"];

// 旧型（後方互換性）
export type TekoWorker = Database["public"]["Tables"]["teko_workers"]["Row"];
export type TekoWorkerInsert =
  Database["public"]["Tables"]["teko_workers"]["Insert"];
export type TekoWorkerUpdate =
  Database["public"]["Tables"]["teko_workers"]["Update"];

export type TekoSite = Database["public"]["Tables"]["teko_sites"]["Row"];
export type TekoSiteInsert =
  Database["public"]["Tables"]["teko_sites"]["Insert"];
export type TekoSiteUpdate =
  Database["public"]["Tables"]["teko_sites"]["Update"];

export type TekoContact = Database["public"]["Tables"]["teko_contacts"]["Row"];
export type TekoContactInsert =
  Database["public"]["Tables"]["teko_contacts"]["Insert"];
export type TekoContactUpdate =
  Database["public"]["Tables"]["teko_contacts"]["Update"];

// 拡張型（リレーション付き）
export type WorkerWithRelations = Worker & {
  users: User | null;
  partners: Partner | null;
};

export type TekoSiteWithProject = TekoSite & {
  projects: Project | null;
  clients: Client | null;
};
