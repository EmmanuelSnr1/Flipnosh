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
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_order_at: string | null
          name: string | null
          phone: string | null
          restaurant_id: string
          total_orders: number
          total_spend_pence: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_order_at?: string | null
          name?: string | null
          phone?: string | null
          restaurant_id: string
          total_orders?: number
          total_spend_pence?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_order_at?: string | null
          name?: string | null
          phone?: string | null
          restaurant_id?: string
          total_orders?: number
          total_spend_pence?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: string
          payload: Json
          restaurant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          restaurant_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          restaurant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfilment_settings: {
        Row: {
          created_at: string
          delivery_enabled: boolean
          delivery_fee_pence: number
          delivery_radius_miles: number
          delivery_time_minutes: number
          id: string
          minimum_delivery_order_pence: number
          pickup_enabled: boolean
          pickup_prep_time_minutes: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_enabled?: boolean
          delivery_fee_pence?: number
          delivery_radius_miles?: number
          delivery_time_minutes?: number
          id?: string
          minimum_delivery_order_pence?: number
          pickup_enabled?: boolean
          pickup_prep_time_minutes?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_enabled?: boolean
          delivery_fee_pence?: number
          delivery_radius_miles?: number
          delivery_time_minutes?: number
          id?: string
          minimum_delivery_order_pence?: number
          pickup_enabled?: boolean
          pickup_prep_time_minutes?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fulfilment_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          id: string
          menu_id: string
          name: string
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_id: string
          name: string
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_id?: string
          name?: string
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          name: string
          price_pence: number
          restaurant_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name: string
          price_pence: number
          restaurant_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name?: string
          price_pence?: number
          restaurant_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          created_at: string
          id: string
          max_select: number
          menu_item_id: string
          min_select: number
          name: string
          required: boolean
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_select?: number
          menu_item_id: string
          min_select?: number
          name: string
          required?: boolean
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_select?: number
          menu_item_id?: string
          min_select?: number
          name?: string
          required?: boolean
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifier_groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_available: boolean
          name: string
          price_delta_pence: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_available?: boolean
          name: string
          price_delta_pence?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_available?: boolean
          name?: string
          price_delta_pence?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifiers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          name: string
          order_id: string
          quantity: number
          restaurant_id: string
          selected_modifiers: Json
          total_pence: number
          unit_price_pence: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name: string
          order_id: string
          quantity: number
          restaurant_id: string
          selected_modifiers?: Json
          total_pence: number
          unit_price_pence: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name?: string
          order_id?: string
          quantity?: number
          restaurant_id?: string
          selected_modifiers?: Json
          total_pence?: number
          unit_price_pence?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivery_fee_pence: number
          fulfilment_type: string
          id: string
          notes: string | null
          order_number: string
          payment_status: string
          restaurant_id: string
          source: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_pence: number
          total_pence: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_fee_pence?: number
          fulfilment_type: string
          id?: string
          notes?: string | null
          order_number: string
          payment_status?: string
          restaurant_id: string
          source?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_pence: number
          total_pence: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_fee_pence?: number
          fulfilment_type?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_status?: string
          restaurant_id?: string
          source?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_pence?: number
          total_pence?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          restaurant_id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          restaurant_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          restaurant_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_campaigns: {
        Row: {
          created_at: string
          destination_url: string
          id: string
          name: string
          orders_count: number
          restaurant_id: string
          revenue_pence: number
          scans: number
          source_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_url: string
          id?: string
          name: string
          orders_count?: number
          restaurant_id: string
          revenue_pence?: number
          scans?: number
          source_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_url?: string
          id?: string
          name?: string
          orders_count?: number
          restaurant_id?: string
          revenue_pence?: number
          scans?: number
          source_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_campaigns_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_branding: {
        Row: {
          created_at: string
          description: string | null
          facebook_url: string | null
          hero_image_url: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          restaurant_id: string
          tagline: string | null
          tiktok_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          hero_image_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          restaurant_id: string
          tagline?: string | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          hero_image_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          restaurant_id?: string
          tagline?: string | null
          tiktok_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_branding_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_theme_configs: {
        Row: {
          accent_color: string
          background_color: string
          button_color: string
          cart_style: string
          category_navigation: string
          created_at: string
          cta_text: string
          enabled_pages: Json
          hero_layout: string
          id: string
          menu_layout: string
          primary_color: string
          restaurant_id: string
          show_badges: boolean
          show_featured_items: boolean
          show_opening_hours: boolean
          show_reviews: boolean
          text_color: string
          theme_name: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          background_color?: string
          button_color?: string
          cart_style?: string
          category_navigation?: string
          created_at?: string
          cta_text?: string
          enabled_pages?: Json
          hero_layout?: string
          id?: string
          menu_layout?: string
          primary_color?: string
          restaurant_id: string
          show_badges?: boolean
          show_featured_items?: boolean
          show_opening_hours?: boolean
          show_reviews?: boolean
          text_color?: string
          theme_name?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          button_color?: string
          cart_style?: string
          category_navigation?: string
          created_at?: string
          cta_text?: string
          enabled_pages?: Json
          hero_layout?: string
          id?: string
          menu_layout?: string
          primary_color?: string
          restaurant_id?: string
          show_badges?: boolean
          show_featured_items?: boolean
          show_opening_hours?: boolean
          show_reviews?: boolean
          text_color?: string
          theme_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_theme_configs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_users: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          cuisine_type: string | null
          email: string | null
          hours: string | null
          id: string
          name: string
          onboarding_completed: boolean
          onboarding_step: string
          phone: string | null
          postcode: string | null
          slug: string
          status: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          subdomain: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          cuisine_type?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          name: string
          onboarding_completed?: boolean
          onboarding_step?: string
          phone?: string | null
          postcode?: string | null
          slug: string
          status?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          subdomain: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          cuisine_type?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          name?: string
          onboarding_completed?: boolean
          onboarding_step?: string
          phone?: string | null
          postcode?: string | null
          slug?: string
          status?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          subdomain?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_restaurant_member: {
        Args: { target_restaurant_id: string }
        Returns: boolean
      }
      is_restaurant_role: {
        Args: { roles: string[]; target_restaurant_id: string }
        Returns: boolean
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

// ─── Convenience row-type aliases ─────────────────────────────────────────────
export type DbRestaurant = Database["public"]["Tables"]["restaurants"]["Row"]
export type DbRestaurantBranding = Database["public"]["Tables"]["restaurant_branding"]["Row"]
export type DbThemeConfig = Database["public"]["Tables"]["restaurant_theme_configs"]["Row"]
export type DbFulfilmentSettings = Database["public"]["Tables"]["fulfilment_settings"]["Row"]
export type DbPlatformSubscription = Database["public"]["Tables"]["platform_subscriptions"]["Row"]
export type DbOrder = Database["public"]["Tables"]["orders"]["Row"]
export type DbOrderItem = Database["public"]["Tables"]["order_items"]["Row"]
export type DbMenuCategory = Database["public"]["Tables"]["menu_categories"]["Row"]
export type DbMenuItem = Database["public"]["Tables"]["menu_items"]["Row"]
export type DbCustomer = Database["public"]["Tables"]["customers"]["Row"]
export type DbQrCampaign = Database["public"]["Tables"]["qr_campaigns"]["Row"]
