export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      groups: {
        Row: {
          id:          string
          name:        string
          description: string | null
          created_by:  string
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:          string
          name:         string
          description?: string | null
          created_by:   string
          created_at?:  string
          updated_at?:  string
        }
        Update: {
          id?:          string
          name?:        string
          description?: string | null
          created_by?:  string
          created_at?:  string
          updated_at?:  string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          id:        string
          group_id:  string
          driver_id: string
          role:      string
          joined_at: string
        }
        Insert: {
          id?:        string
          group_id:   string
          driver_id:  string
          role?:      string
          joined_at?: string
        }
        Update: {
          id?:        string
          group_id?:  string
          driver_id?: string
          role?:      string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          driver_id: string
          expiry_date: string | null
          file_url: string | null
          id: string
          label: string
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          label: string
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          label?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          bio: string | null
          cpam_enabled: boolean
          created_at: string
          current_lat: number | null
          current_lng: number | null
          current_position_updated_at: string | null
          id: string
          is_online: boolean
          is_verified: boolean
          last_seen_at: string | null
          organization_id: string
          pro_number: string | null
          rating: number
          total_rides: number
          updated_at: string
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          bio?: string | null
          cpam_enabled?: boolean
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_position_updated_at?: string | null
          id: string
          is_online?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          organization_id: string
          pro_number?: string | null
          rating?: number
          total_rides?: number
          updated_at?: string
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          bio?: string | null
          cpam_enabled?: boolean
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_position_updated_at?: string | null
          id?: string
          is_online?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          organization_id?: string
          pro_number?: string | null
          rating?: number
          total_rides?: number
          updated_at?: string
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          accepted_at: string | null
          arrived_at_dest_at: string | null
          arrived_at_pickup_at: string | null
          auto_completed: boolean
          client_id: string | null
          companion: boolean
          completed_at: string | null
          created_at: string
          departement: string | null
          departure: string
          departure_lat: number | null
          departure_lng: number | null
          destination: string
          destination_lat: number | null
          destination_lng: number | null
          distance_km: number | null
          driver_id: string | null
          dropoff_at: string | null
          duration_min: number | null
          enroute_at: string | null
          static_duration_min: number | null
          id: string
          medical_motif: string | null
          no_show: boolean
          notes: string | null
          organization_id: string | null
          passengers: number | null
          patient_name: string | null
          phone: string | null
          pickup_at: string | null
          pickup_signature_url: string | null
          price_eur: number | null
          price_min_eur: number | null
          price_max_eur: number | null
          return_time: string | null
          return_trip: boolean
          scheduled_at: string
          shared_by: string | null
          status: string
          transport_type: string | null
          transport_voucher_url: string | null
          type: string
          updated_at: string
          view_count: number
          visibility: string
        }
        Insert: {
          accepted_at?: string | null
          arrived_at_dest_at?: string | null
          arrived_at_pickup_at?: string | null
          auto_completed?: boolean
          client_id?: string | null
          companion?: boolean
          completed_at?: string | null
          created_at?: string
          departement?: string | null
          departure: string
          departure_lat?: number | null
          departure_lng?: number | null
          destination: string
          destination_lat?: number | null
          destination_lng?: number | null
          distance_km?: number | null
          driver_id?: string | null
          dropoff_at?: string | null
          duration_min?: number | null
          enroute_at?: string | null
          static_duration_min?: number | null
          id?: string
          medical_motif?: string | null
          no_show?: boolean
          notes?: string | null
          organization_id?: string | null
          passengers?: number | null
          patient_name?: string | null
          phone?: string | null
          pickup_at?: string | null
          pickup_signature_url?: string | null
          price_eur?: number | null
          price_min_eur?: number | null
          price_max_eur?: number | null
          return_time?: string | null
          return_trip?: boolean
          scheduled_at?: string
          shared_by?: string | null
          status?: string
          transport_type?: string | null
          transport_voucher_url?: string | null
          type?: string
          updated_at?: string
          view_count?: number
          visibility?: string
        }
        Update: {
          accepted_at?: string | null
          arrived_at_dest_at?: string | null
          arrived_at_pickup_at?: string | null
          auto_completed?: boolean
          client_id?: string | null
          companion?: boolean
          completed_at?: string | null
          created_at?: string
          departement?: string | null
          departure?: string
          departure_lat?: number | null
          departure_lng?: number | null
          destination?: string
          destination_lat?: number | null
          destination_lng?: number | null
          distance_km?: number | null
          driver_id?: string | null
          dropoff_at?: string | null
          duration_min?: number | null
          enroute_at?: string | null
          static_duration_min?: number | null
          id?: string
          medical_motif?: string | null
          no_show?: boolean
          notes?: string | null
          organization_id?: string | null
          passengers?: number | null
          patient_name?: string | null
          phone?: string | null
          pickup_at?: string | null
          pickup_signature_url?: string | null
          price_eur?: number | null
          price_min_eur?: number | null
          price_max_eur?: number | null
          return_time?: string | null
          return_trip?: boolean
          scheduled_at?: string
          shared_by?: string | null
          status?: string
          transport_type?: string | null
          transport_voucher_url?: string | null
          type?: string
          updated_at?: string
          view_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_groups: {
        Row: {
          mission_id: string
          group_id:   string
          created_at: string
        }
        Insert: {
          mission_id: string
          group_id:   string
          created_at?: string
        }
        Update: {
          mission_id?: string
          group_id?:   string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_groups_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          siret: string | null
          plan: string
          stripe_customer_id: string | null
          auto_dispatch_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          siret?: string | null
          plan?: string
          stripe_customer_id?: string | null
          auto_dispatch_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          siret?: string | null
          plan?: string
          stripe_customer_id?: string | null
          auto_dispatch_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_invitations: {
        Row: {
          id: string
          org_id: string
          invited_by: string
          contact: string
          contact_type: string
          role: string
          token: string
          status: string
          expires_at: string
          accepted_by: string | null
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          invited_by: string
          contact: string
          contact_type: string
          role?: string
          token: string
          status?: string
          expires_at?: string
          accepted_by?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          invited_by?: string
          contact?: string
          contact_type?: string
          role?: string
          token?: string
          status?: string
          expires_at?: string
          accepted_by?: string | null
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          org_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          org_id: string
          user_id: string
          role: string
          joined_at?: string
        }
        Update: {
          org_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_views: {
        Row: {
          id: string
          mission_id: string
          viewer_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          mission_id: string
          viewer_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          mission_id?: string
          viewer_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_views_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_eur: number
          created_at: string
          driver_id: string
          iban: string | null
          id: string
          mission_id: string | null
          paid_at: string | null
          status: string
        }
        Insert: {
          amount_eur: number
          created_at?: string
          driver_id: string
          iban?: string | null
          id?: string
          mission_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount_eur?: number
          created_at?: string
          driver_id?: string
          iban?: string | null
          id?: string
          mission_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      accept_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      remove_org_member: {
        Args: { target_org_id: string; target_user_id: string }
        Returns: Json
      }
      patron_assign_mission: {
        Args: { target_mission_id: string; target_driver_id: string }
        Returns: Json
      }
      get_marketplace_missions: {
        Args: { p_departments?: string[] | null; p_limit?: number }
        Returns: Json[]
      }
      delete_my_account: {
        Args: Record<string, never>
        Returns: undefined
      }
      _anonymize_user_internal: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      mask_initials: {
        Args: { p_full_name: string }
        Returns: string | null
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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

// ─── Types de table partagés ─────────────────────────────────────────────────
export type Mission  = Database['public']['Tables']['missions']['Row'] & {
  // Groupes ciblés (relation many-to-many) : embarqué par les queries qui
  // font `.select('*, mission_groups(group_id)')`.
  mission_groups?: { group_id: string }[] | null
  // Profil du chauffeur qui a publié la mission (alias de la FK client_id).
  publisher?: { full_name: string | null } | null
}
export type Profile  = Database['public']['Tables']['profiles']['Row']
export type Document = Database['public']['Tables']['driver_documents']['Row']
export type Payment  = Database['public']['Tables']['payments']['Row']
export type Driver   = Database['public']['Tables']['drivers']['Row']
export type Organization       = Database['public']['Tables']['organizations']['Row']
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type OrgInvitation      = Database['public']['Tables']['org_invitations']['Row']
export type OrgRole = 'owner' | 'admin' | 'dispatcher' | 'accountant' | 'viewer'
