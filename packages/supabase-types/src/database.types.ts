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
      ai_usage: {
        Row: {
          audio_seconds: number | null
          cost_usd: number
          created_at: string
          endpoint: string
          id: number
          input_tokens: number
          model: string
          output_tokens: number
          user_id: string | null
        }
        Insert: {
          audio_seconds?: number | null
          cost_usd?: number
          created_at?: string
          endpoint: string
          id?: number
          input_tokens?: number
          model: string
          output_tokens?: number
          user_id?: string | null
        }
        Update: {
          audio_seconds?: number | null
          cost_usd?: number
          created_at?: string
          endpoint?: string
          id?: number
          input_tokens?: number
          model?: string
          output_tokens?: number
          user_id?: string | null
        }
        Relationships: []
      }
      auth_login_events: {
        Row: {
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      cache_google: {
        Row: {
          expires_at: string
          fetched_at: string
          key: string
          kind: string
          value: Json
        }
        Insert: {
          expires_at: string
          fetched_at?: string
          key: string
          kind: string
          value: Json
        }
        Update: {
          expires_at?: string
          fetched_at?: string
          key?: string
          kind?: string
          value?: Json
        }
        Relationships: []
      }
      driver_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
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
          click_loss_streak: number
          cpam_enabled: boolean
          created_at: string
          current_lat: number | null
          current_lng: number | null
          current_position_updated_at: string | null
          id: string
          is_online: boolean
          is_verified: boolean
          last_seen_at: string | null
          last_streak_update: string | null
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
          click_loss_streak?: number
          cpam_enabled?: boolean
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_position_updated_at?: string | null
          id: string
          is_online?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          last_streak_update?: string | null
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
          click_loss_streak?: number
          cpam_enabled?: boolean
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_position_updated_at?: string | null
          id?: string
          is_online?: boolean
          is_verified?: boolean
          last_seen_at?: string | null
          last_streak_update?: string | null
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
      google_api_costs: {
        Row: {
          cost_usd: number
          created_at: string
          id: number
          notes: string | null
          period_month: string
          request_count: number | null
          service: string
          updated_at: string
        }
        Insert: {
          cost_usd: number
          created_at?: string
          id?: number
          notes?: string | null
          period_month: string
          request_count?: number | null
          service: string
          updated_at?: string
        }
        Update: {
          cost_usd?: number
          created_at?: string
          id?: number
          notes?: string | null
          period_month?: string
          request_count?: number | null
          service?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          driver_id: string
          group_id: string
          id: string
          joined_at: string | null
          role: string
        }
        Insert: {
          driver_id: string
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string
        }
        Update: {
          driver_id?: string
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          fleet_org_id: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          fleet_org_id?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          fleet_org_id?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_fleet_org_id_fkey"
            columns: ["fleet_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_groups: {
        Row: {
          created_at: string
          group_id: string
          mission_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          mission_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          mission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_groups_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_offers: {
        Row: {
          distance_km_at_offer: number | null
          driver_id: string
          expires_at: string
          id: string
          mission_id: string
          radius_km_at_offer: number
          responded_at: string | null
          sent_at: string
          status: string
          unlock_at: string
        }
        Insert: {
          distance_km_at_offer?: number | null
          driver_id: string
          expires_at: string
          id?: string
          mission_id: string
          radius_km_at_offer: number
          responded_at?: string | null
          sent_at?: string
          status?: string
          unlock_at?: string
        }
        Update: {
          distance_km_at_offer?: number | null
          driver_id?: string
          expires_at?: string
          id?: string
          mission_id?: string
          radius_km_at_offer?: number
          responded_at?: string | null
          sent_at?: string
          status?: string
          unlock_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_offers_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_views: {
        Row: {
          id: string
          mission_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          mission_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          mission_id?: string
          viewed_at?: string
          viewer_id?: string
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
          price_max_eur: number | null
          price_min_eur: number | null
          return_time: string | null
          return_trip: boolean
          scheduled_at: string
          shared_by: string | null
          static_duration_min: number | null
          status: string
          target_user_ids: string[] | null
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
          price_max_eur?: number | null
          price_min_eur?: number | null
          return_time?: string | null
          return_trip?: boolean
          scheduled_at?: string
          shared_by?: string | null
          static_duration_min?: number | null
          status?: string
          target_user_ids?: string[] | null
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
          price_max_eur?: number | null
          price_min_eur?: number | null
          return_time?: string | null
          return_trip?: boolean
          scheduled_at?: string
          shared_by?: string | null
          static_duration_min?: number | null
          status?: string
          target_user_ids?: string[] | null
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
          {
            foreignKeyName: "missions_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          contact: string
          contact_type: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          contact: string
          contact_type: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          role?: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          contact?: string
          contact_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: string
          status?: string
          token?: string
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
          joined_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          joined_at?: string
          org_id?: string
          role?: string
          user_id?: string
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
      organizations: {
        Row: {
          auto_dispatch_enabled: boolean
          created_at: string
          id: string
          name: string
          plan: string
          siret: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          auto_dispatch_enabled?: boolean
          created_at?: string
          id?: string
          name: string
          plan?: string
          siret?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_dispatch_enabled?: boolean
          created_at?: string
          id?: string
          name?: string
          plan?: string
          siret?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      push_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          id: string
          last_seen_at: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          id?: string
          last_seen_at?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          id?: string
          last_seen_at?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _anonymize_user_internal: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      accept_invitation: { Args: { invitation_token: string }; Returns: Json }
      accept_mission_offer: { Args: { p_offer_id: string }; Returns: Json }
      auto_complete_overdue_missions: { Args: never; Returns: number }
      compute_visible_drivers: {
        Args: { p_mission_id: string; p_radius_km: number }
        Returns: {
          current_lat: number
          current_lng: number
          distance_km: number
          driver_id: string
          last_position_at: string
        }[]
      }
      current_org_ids: { Args: never; Returns: string[] }
      decay_idle_streaks: { Args: never; Returns: number }
      delete_my_account: { Args: never; Returns: undefined }
      ensure_fleet_group: {
        Args: { fallback_creator: string; target_org_id: string }
        Returns: string
      }
      expire_pending_offers: { Args: never; Returns: number }
      expire_stale_missions: { Args: never; Returns: undefined }
      get_drivers_for_dept_push: {
        Args: { p_dept: string }
        Returns: {
          token: string
          user_id: string
        }[]
      }
      get_marketplace_missions: {
        Args: { p_departments?: string[]; p_limit?: number }
        Returns: Json[]
      }
      get_my_group_ids: { Args: never; Returns: string[] }
      get_poster_token_for_accepted_mission: {
        Args: { p_caller_user_id: string; p_mission_id: string }
        Returns: {
          departure: string
          destination: string
          driver_name: string
          poster_id: string
          token: string
        }[]
      }
      haversine_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      mask_initials: { Args: { p_full_name: string }; Returns: string }
      patron_assign_mission: {
        Args: { target_driver_id: string; target_mission_id: string }
        Returns: Json
      }
      refuse_mission_offer: { Args: { p_offer_id: string }; Returns: Json }
      remove_org_member: {
        Args: { target_org_id: string; target_user_id: string }
        Returns: Json
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
export type DriverBlock = Database['public']['Tables']['driver_blocks']['Row']
