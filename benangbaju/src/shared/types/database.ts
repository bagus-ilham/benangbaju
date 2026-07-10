export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_mobile_url: string | null
          image_url: string
          is_active: boolean
          link_url: string | null
          position: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_mobile_url?: string | null
          image_url: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_mobile_url?: string | null
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          id: string
          quantity: number
          variant_id: string
        }
        Insert: {
          cart_id: string
          id?: string
          quantity?: number
          variant_id: string
        }
        Update: {
          cart_id?: string
          id?: string
          quantity?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          starts_at: string | null
        }
        Insert: {
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          starts_at?: string | null
        }
        Update: {
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          starts_at?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          city_name: string
          district_name: string
          id: string
          postal_code: string | null
          province_name: string
          zone_id: string | null
        }
        Insert: {
          city_name: string
          district_name: string
          id?: string
          postal_code?: string | null
          province_name: string
          zone_id?: string | null
        }
        Update: {
          city_name?: string
          district_name?: string
          id?: string
          postal_code?: string | null
          province_name?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "districts_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sale_items: {
        Row: {
          discount_percent: number | null
          flash_sale_id: string
          id: string
          original_price: number
          quota: number
          sale_price: number
          sold_count: number
          variant_id: string
        }
        Insert: {
          discount_percent?: number | null
          flash_sale_id: string
          id?: string
          original_price: number
          quota?: number
          sale_price: number
          sold_count?: number
          variant_id: string
        }
        Update: {
          discount_percent?: number | null
          flash_sale_id?: string
          id?: string
          original_price?: number
          quota?: number
          sale_price?: number
          sold_count?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_items_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          name: string
          starts_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          name: string
          starts_at: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          name?: string
          starts_at?: string
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          created_at: string
          html_body: string
          id: string
          is_active: boolean
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_body: string
          id?: string
          is_active?: boolean
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_body?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          flash_sale_item_id: string | null
          id: string
          order_id: string
          price: number
          product_name: string
          quantity: number
          sku: string
          subtotal: number
          variant_id: string | null
          variant_name: string
        }
        Insert: {
          flash_sale_item_id?: string | null
          id?: string
          order_id: string
          price: number
          product_name: string
          quantity: number
          sku: string
          subtotal: number
          variant_id?: string | null
          variant_name: string
        }
        Update: {
          flash_sale_item_id?: string | null
          id?: string
          order_id?: string
          price?: number
          product_name?: string
          quantity?: number
          sku?: string
          subtotal?: number
          variant_id?: string | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_flash_sale_item_id_fkey"
            columns: ["flash_sale_item_id"]
            isOneToOne: false
            referencedRelation: "flash_sale_items"
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
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_shipping: {
        Row: {
          city_name: string
          courier_name: string | null
          delivered_at: string | null
          district_name: string
          full_address: string
          id: string
          order_id: string
          phone: string
          postal_code: string
          province_name: string
          recipient_name: string
          shipped_at: string | null
          status: string
          tracking_number: string | null
        }
        Insert: {
          city_name: string
          courier_name?: string | null
          delivered_at?: string | null
          district_name: string
          full_address: string
          id?: string
          order_id: string
          phone: string
          postal_code: string
          province_name: string
          recipient_name: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
        }
        Update: {
          city_name?: string
          courier_name?: string | null
          delivered_at?: string | null
          district_name?: string
          full_address?: string
          id?: string
          order_id?: string
          phone?: string
          postal_code?: string
          province_name?: string
          recipient_name?: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_shipping_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          discount_amount: number
          id: string
          notes: string | null
          order_number: string
          shipping_cost: number
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
          voucher_id: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          discount_amount?: number
          id?: string
          notes?: string | null
          order_number: string
          shipping_cost: number
          status?: string
          subtotal: number
          total_amount: number
          updated_at?: string
          user_id: string
          voucher_id?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          discount_amount?: number
          id?: string
          notes?: string | null
          order_number?: string
          shipping_cost?: number
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          midtrans_order_id: string | null
          payment_id: string | null
          raw_payload: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          midtrans_order_id?: string | null
          payment_id?: string | null
          raw_payload?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          midtrans_order_id?: string | null
          payment_id?: string | null
          raw_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          expired_at: string | null
          id: string
          invoice_url: string | null
          midtrans_order_id: string | null
          midtrans_response: Json | null
          midtrans_transaction_id: string | null
          order_id: string
          paid_at: string | null
          payment_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          expired_at?: string | null
          id?: string
          invoice_url?: string | null
          midtrans_order_id?: string | null
          midtrans_response?: Json | null
          midtrans_transaction_id?: string | null
          order_id: string
          paid_at?: string | null
          payment_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          expired_at?: string | null
          id?: string
          invoice_url?: string | null
          midtrans_order_id?: string | null
          midtrans_response?: Json | null
          midtrans_transaction_id?: string | null
          order_id?: string
          paid_at?: string | null
          payment_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          url: string
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          url: string
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_marketplace_links: {
        Row: {
          id: string
          label: string | null
          platform: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          id?: string
          label?: string | null
          platform: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          id?: string
          label?: string | null
          platform?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_marketplace_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_rating_summary: {
        Row: {
          avg_rating: number
          product_id: string
          rating_1_count: number
          rating_2_count: number
          rating_3_count: number
          rating_4_count: number
          rating_5_count: number
          total_reviews: number
          updated_at: string
          with_media_count: number
        }
        Insert: {
          avg_rating?: number
          product_id: string
          rating_1_count?: number
          rating_2_count?: number
          rating_3_count?: number
          rating_4_count?: number
          rating_5_count?: number
          total_reviews?: number
          updated_at?: string
          with_media_count?: number
        }
        Update: {
          avg_rating?: number
          product_id?: string
          rating_1_count?: number
          rating_2_count?: number
          rating_3_count?: number
          rating_4_count?: number
          rating_5_count?: number
          total_reviews?: number
          updated_at?: string
          with_media_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_rating_summary_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          body: string
          created_at: string
          helpful_count: number
          id: string
          is_anonymous: boolean
          is_pinned: boolean
          is_verified_purchase: boolean
          order_item_id: string
          product_id: string
          rating: number
          status: string
          title: string | null
          user_id: string
          variant_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_anonymous?: boolean
          is_pinned?: boolean
          is_verified_purchase?: boolean
          order_item_id: string
          product_id: string
          rating: number
          status?: string
          title?: string | null
          user_id: string
          variant_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_anonymous?: boolean
          is_pinned?: boolean
          is_verified_purchase?: boolean
          order_item_id?: string
          product_id?: string
          rating?: number
          status?: string
          title?: string | null
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_attrs: {
        Row: {
          attr_name: string
          attr_value: string
          id: string
          variant_id: string
        }
        Insert: {
          attr_name: string
          attr_value: string
          id?: string
          variant_id: string
        }
        Update: {
          attr_name?: string
          attr_value?: string
          id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_attrs_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_price: number | null
          id: string
          is_active: boolean
          name: string
          price: number
          product_id: string
          sku: string
          stock: number
          weight_gram: number | null
        }
        Insert: {
          compare_price?: number | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          product_id: string
          sku: string
          stock?: number
          weight_gram?: number | null
        }
        Update: {
          compare_price?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          product_id?: string
          sku?: string
          stock?: number
          weight_gram?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          search_vector: unknown
          short_description: string | null
          slug: string
          updated_at: string
          weight_gram: number
          size_guide: string | null
          care_guide: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          search_vector?: unknown
          short_description?: string | null
          slug: string
          updated_at?: string
          weight_gram?: number
          size_guide?: string | null
          care_guide?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          search_vector?: unknown
          short_description?: string | null
          slug?: string
          updated_at?: string
          weight_gram?: number
          size_guide?: string | null
          care_guide?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      redirects: {
        Row: {
          created_at: string
          from_path: string
          id: string
          is_active: boolean
          status_code: number
          to_path: string
        }
        Insert: {
          created_at?: string
          from_path: string
          id?: string
          is_active?: boolean
          status_code?: number
          to_path: string
        }
        Update: {
          created_at?: string
          from_path?: string
          id?: string
          is_active?: boolean
          status_code?: number
          to_path?: string
        }
        Relationships: []
      }
      return_items: {
        Row: {
          id: string
          order_item_id: string
          quantity: number
          reason: string | null
          return_request_id: string
        }
        Insert: {
          id?: string
          order_item_id: string
          quantity: number
          reason?: string | null
          return_request_id: string
        }
        Update: {
          id?: string
          order_item_id?: string
          quantity?: number
          reason?: string | null
          return_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_request_id_fkey"
            columns: ["return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      return_media: {
        Row: {
          id: string
          return_request_id: string
          sort_order: number
          url: string
        }
        Insert: {
          id?: string
          return_request_id: string
          sort_order?: number
          url: string
        }
        Update: {
          id?: string
          return_request_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_media_return_request_id_fkey"
            columns: ["return_request_id"]
            isOneToOne: false
            referencedRelation: "return_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      return_requests: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          completed_at: string | null
          created_at: string
          customer_notes: string | null
          id: string
          order_id: string
          reason: string
          refund_account_name: string | null
          refund_account_number: string | null
          refund_amount: number | null
          refund_bank_name: string | null
          refund_transferred_at: string | null
          rejected_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_notes?: string | null
          id?: string
          order_id: string
          reason: string
          refund_account_name?: string | null
          refund_account_number?: string | null
          refund_amount?: number | null
          refund_bank_name?: string | null
          refund_transferred_at?: string | null
          rejected_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_notes?: string | null
          id?: string
          order_id?: string
          reason?: string
          refund_account_name?: string | null
          refund_account_number?: string | null
          refund_amount?: number | null
          refund_bank_name?: string | null
          refund_transferred_at?: string | null
          rejected_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_media: {
        Row: {
          id: string
          review_id: string
          sort_order: number
          type: string
          url: string
        }
        Insert: {
          id?: string
          review_id: string
          sort_order?: number
          type: string
          url: string
        }
        Update: {
          id?: string
          review_id?: string
          sort_order?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          admin_id: string
          body: string
          created_at: string
          id: string
          review_id: string
        }
        Insert: {
          admin_id: string
          body: string
          created_at?: string
          id?: string
          review_id: string
        }
        Update: {
          admin_id?: string
          body?: string
          created_at?: string
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          base_price: number
          courier_name: string
          created_at: string
          etd_days_max: number
          etd_days_min: number
          id: string
          is_active: boolean
          min_weight_gram: number
          price_per_kg: number
          zone_id: string
        }
        Insert: {
          base_price: number
          courier_name: string
          created_at?: string
          etd_days_max: number
          etd_days_min: number
          id?: string
          is_active?: boolean
          min_weight_gram?: number
          price_per_kg: number
          zone_id: string
        }
        Update: {
          base_price?: number
          courier_name?: string
          created_at?: string
          etd_days_max?: number
          etd_days_min?: number
          id?: string
          is_active?: boolean
          min_weight_gram?: number
          price_per_kg?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zone_coverage: {
        Row: {
          id: string
          province_name: string
          zone_id: string
        }
        Insert: {
          id?: string
          province_name: string
          zone_id: string
        }
        Update: {
          id?: string
          province_name?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zone_coverage_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          group: string
          key: string
          label: string
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          group?: string
          key: string
          label: string
          type?: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          group?: string
          key?: string
          label?: string
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      stock_mutations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_item_id: string | null
          qty: number
          qty_after: number
          qty_before: number
          type: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_item_id?: string | null
          qty: number
          qty_after: number
          qty_before: number
          type: string
          variant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_item_id?: string | null
          qty?: number
          qty_after?: number
          qty_before?: number
          type?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_mutations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mutations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_mutations_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_notifications: {
        Row: {
          created_at: string
          id: string
          is_notified: boolean
          notified_at: string | null
          user_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_notified?: boolean
          notified_at?: string | null
          user_id: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_notified?: boolean
          notified_at?: string | null
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_notifications_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_addresses: {
        Row: {
          city_name: string
          created_at: string
          district_name: string
          full_address: string
          id: string
          is_default: boolean
          label: string
          phone: string
          postal_code: string
          province_name: string
          recipient_name: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          city_name: string
          created_at?: string
          district_name: string
          full_address: string
          id?: string
          is_default?: boolean
          label: string
          phone: string
          postal_code: string
          province_name: string
          recipient_name: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          city_name?: string
          created_at?: string
          district_name?: string
          full_address?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          postal_code?: string
          province_name?: string
          recipient_name?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_addresses_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_usages: {
        Row: {
          discount_amount: number
          id: string
          order_id: string
          used_at: string
          user_id: string
          voucher_id: string
        }
        Insert: {
          discount_amount: number
          id?: string
          order_id: string
          used_at?: string
          user_id: string
          voucher_id: string
        }
        Update: {
          discount_amount?: number
          id?: string
          order_id?: string
          used_at?: string
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_usages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_usages_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          expires_at: string
          id: string
          is_active: boolean
          max_discount: number | null
          min_purchase: number
          name: string
          starts_at: string
          updated_at: string
          usage_limit: number | null
          usage_per_user: number
          used_count: number
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          expires_at: string
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_purchase?: number
          name: string
          starts_at: string
          updated_at?: string
          usage_limit?: number | null
          usage_per_user?: number
          used_count?: number
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_purchase?: number
          name?: string
          starts_at?: string
          updated_at?: string
          usage_limit?: number | null
          usage_per_user?: number
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_analytics_data: { Args: Record<string, unknown>; Returns: Json }
      get_dashboard_revenue: { Args: Record<string, unknown>; Returns: Json }
      admin_create_flash_sale: { Args: Record<string, unknown>; Returns: Json }
      admin_update_flash_sale: { Args: Record<string, unknown>; Returns: Json }
      admin_create_product: { Args: Record<string, unknown>; Returns: Json }
      admin_update_product: { Args: Record<string, unknown>; Returns: Json }
      admin_create_shipping_zone: { Args: Record<string, unknown>; Returns: Json }
      admin_update_shipping_zone: { Args: Record<string, unknown>; Returns: Json }
      bulk_update_stock: { Args: Record<string, unknown>; Returns: Json }
      adjust_stock: {
        Args: {
          p_admin_id?: string
          p_note?: string
          p_qty: number
          p_variant_id: string
        }
        Returns: Json
      }
      calculate_shipping: {
        Args: { p_weight_gram: number; p_zone_id: string }
        Returns: Json
      }
      cancel_order: {
        Args: { p_cancel_reason?: string; p_order_id: string }
        Returns: Json
      }
      confirm_delivery: { Args: { p_order_id: string }; Returns: Json }
      create_order: {
        Args: {
          p_address_id: string
          p_courier_name?: string
          p_notes?: string
          p_shipping_cost?: number
          p_user_id: string
          p_voucher_code?: string
        }
        Returns: Json
      }
      generate_order_number: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      lazy_cancel_expired_orders: { Args: { p_user_id: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      validate_voucher: {
        Args: { p_code: string; p_subtotal: number; p_user_id: string }
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

