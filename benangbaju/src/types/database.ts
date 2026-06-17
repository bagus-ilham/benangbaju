export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

interface RawDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          avatar_url: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          parent_id: string | null
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
        }
        Insert: {
          id?: string
          parent_id?: string | null
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
        }
        Update: {
          parent_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
        }
      }
      collections: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
        }
        Update: {
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
        }
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
      }
      banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          image_url: string
          image_mobile_url: string | null
          link_url: string | null
          position: string
          sort_order: number
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          image_url: string
          image_mobile_url?: string | null
          link_url?: string | null
          position: string
          sort_order?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
        }
        Update: {
          title?: string
          subtitle?: string | null
          image_url?: string
          image_mobile_url?: string | null
          link_url?: string | null
          position?: string
          sort_order?: number
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          category_id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          weight_gram: number
          is_active: boolean
          is_featured: boolean
          meta_title: string | null
          meta_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          weight_gram?: number
          is_active?: boolean
          is_featured?: boolean
          meta_title?: string | null
          meta_description?: string | null
        }
        Update: {
          category_id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          weight_gram?: number
          is_active?: boolean
          is_featured?: boolean
          meta_title?: string | null
          meta_description?: string | null
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          name: string
          price: number
          compare_price: number | null
          stock: number
          weight_gram: number | null
          is_active: boolean
        }
        Insert: {
          id?: string
          product_id: string
          sku: string
          name: string
          price: number
          compare_price?: number | null
          stock?: number
          weight_gram?: number | null
          is_active?: boolean
        }
        Update: {
          product_id?: string
          sku?: string
          name?: string
          price?: number
          compare_price?: number | null
          stock?: number
          weight_gram?: number | null
          is_active?: boolean
        }
      }
      product_variant_attrs: {
        Row: {
          id: string
          variant_id: string
          attr_name: string
          attr_value: string
        }
        Insert: {
          id?: string
          variant_id: string
          attr_name: string
          attr_value: string
        }
        Update: {
          variant_id?: string
          attr_name?: string
          attr_value?: string
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          url: string
          alt_text: string | null
          sort_order: number
          is_primary: boolean
        }
        Insert: {
          id?: string
          product_id: string
          variant_id?: string | null
          url: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
        }
        Update: {
          product_id?: string
          variant_id?: string | null
          url?: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
        }
      }
      product_marketplace_links: {
        Row: {
          id: string
          product_id: string
          platform: string
          url: string
          label: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          product_id: string
          platform: string
          url: string
          label?: string | null
          sort_order?: number
        }
        Update: {
          product_id?: string
          platform?: string
          url?: string
          label?: string | null
          sort_order?: number
        }
      }
      product_rating_summary: {
        Row: {
          product_id: string
          avg_rating: number
          total_reviews: number
        }
        Insert: {
          product_id: string
          avg_rating?: number
          total_reviews?: number
        }
        Update: {
          product_id?: string
          avg_rating?: number
          total_reviews?: number
        }
      }
      carts: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string | null
          session_id?: string | null
        }
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          variant_id: string
          quantity: number
        }
        Insert: {
          id?: string
          cart_id: string
          variant_id: string
          quantity: number
        }
        Update: {
          cart_id?: string
          variant_id?: string
          quantity?: number
        }
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          variant_id?: string | null
        }
        Update: {
          user_id?: string
          product_id?: string
          variant_id?: string | null
        }
      }
      flash_sales: {
        Row: {
          id: string
          name: string
          description: string | null
          banner_url: string | null
          starts_at: string
          ends_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          banner_url?: string | null
          starts_at: string
          ends_at: string
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          banner_url?: string | null
          starts_at?: string
          ends_at?: string
          is_active?: boolean
        }
      }
      flash_sale_items: {
        Row: {
          id: string
          flash_sale_id: string
          variant_id: string
          original_price: number
          sale_price: number
          discount_percent: number
          quota: number
          sold_count: number
        }
        Insert: {
          id?: string
          flash_sale_id: string
          variant_id: string
          original_price: number
          sale_price: number
          discount_percent?: number
          quota?: number
          sold_count?: number
        }
        Update: {
          flash_sale_id?: string
          variant_id?: string
          original_price?: number
          sale_price?: number
          discount_percent?: number
          quota?: number
          sold_count?: number
        }
      }
      product_reviews: {
        Row: {
          id: string
          order_item_id: string
          product_id: string
          variant_id: string | null
          user_id: string
          rating: number
          title: string | null
          body: string
          is_anonymous: boolean
          is_verified_purchase: boolean
          is_pinned: boolean
          status: string
          helpful_count: number
          created_at: string
        }
        Insert: {
          id?: string
          order_item_id: string
          product_id: string
          variant_id?: string | null
          user_id: string
          rating: number
          title?: string | null
          body: string
          is_anonymous?: boolean
          is_verified_purchase?: boolean
          is_pinned?: boolean
          status?: string
          helpful_count?: number
          created_at?: string
        }
        Update: {
          rating?: number
          title?: string | null
          body?: string
          is_pinned?: boolean
          status?: string
          helpful_count?: number
        }
      }
      review_media: {
        Row: {
          id: string
          review_id: string
          url: string
          type: string
          sort_order: number
        }
        Insert: {
          id?: string
          review_id: string
          url: string
          type: string
          sort_order?: number
        }
        Update: {
          review_id?: string
          url?: string
          type?: string
          sort_order?: number
        }
      }
      review_replies: {
        Row: {
          id: string
          review_id: string
          admin_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          admin_id: string
          body: string
          created_at?: string
        }
        Update: {
          review_id?: string
          admin_id?: string
          body?: string
        }
      }
      user_addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          recipient_name: string
          phone: string
          province_name: string
          city_name: string
          district_name: string
          postal_code: string
          full_address: string
          zone_id: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          recipient_name: string
          phone: string
          province_name: string
          city_name: string
          district_name: string
          postal_code: string
          full_address: string
          zone_id?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          label?: string
          recipient_name?: string
          phone?: string
          province_name?: string
          city_name?: string
          district_name?: string
          postal_code?: string
          full_address?: string
          zone_id?: string | null
          is_default?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string
          voucher_id: string | null
          status: string
          subtotal: number
          shipping_cost: number
          discount_amount: number
          total_amount: number
          notes: string | null
          cancel_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          user_id: string
          voucher_id?: string | null
          status?: string
          subtotal: number
          shipping_cost?: number
          discount_amount?: number
          total_amount: number
          notes?: string | null
          cancel_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          voucher_id?: string | null
          status?: string
          subtotal?: number
          shipping_cost?: number
          discount_amount?: number
          total_amount?: number
          notes?: string | null
          cancel_reason?: string | null
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          variant_id: string
          flash_sale_item_id: string | null
          product_name: string
          variant_name: string
          sku: string
          price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          variant_id: string
          flash_sale_item_id?: string | null
          product_name: string
          variant_name: string
          sku: string
          price: number
          quantity: number
          subtotal: number
        }
        Update: {
          order_id?: string
          variant_id?: string
          flash_sale_item_id?: string | null
          product_name?: string
          variant_name?: string
          sku?: string
          price?: number
          quantity?: number
          subtotal?: number
        }
      }
      order_shipping: {
        Row: {
          id: string
          order_id: string
          recipient_name: string
          phone: string
          full_address: string
          province_name: string
          city_name: string
          district_name: string
          postal_code: string
          courier_name: string
          tracking_number: string | null
          shipped_at: string | null
          delivered_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          recipient_name: string
          phone: string
          full_address: string
          province_name: string
          city_name: string
          district_name: string
          postal_code: string
          courier_name: string
          tracking_number?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
        }
        Update: {
          recipient_name?: string
          phone?: string
          full_address?: string
          province_name?: string
          city_name?: string
          district_name?: string
          postal_code?: string
          courier_name?: string
          tracking_number?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          midtrans_order_id: string
          midtrans_transaction_id: string | null
          status: string
          amount: number
          payment_type: string | null
          va_number: string | null
          biller_code: string | null
          payment_code: string | null
          qr_url: string | null
          snap_token: string | null
          invoice_url: string | null
          midtrans_response: Json | null
          paid_at: string | null
          expired_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          midtrans_order_id: string
          midtrans_transaction_id?: string | null
          status?: string
          amount: number
          payment_type?: string | null
          va_number?: string | null
          biller_code?: string | null
          payment_code?: string | null
          qr_url?: string | null
          snap_token?: string | null
          invoice_url?: string | null
          midtrans_response?: Json | null
          paid_at?: string | null
          expired_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          amount?: number
          payment_type?: string | null
          va_number?: string | null
          biller_code?: string | null
          payment_code?: string | null
          qr_url?: string | null
          snap_token?: string | null
          invoice_url?: string | null
          midtrans_transaction_id?: string | null
          midtrans_response?: Json | null
          paid_at?: string | null
          expired_at?: string | null
          updated_at?: string
        }
      }
      vouchers: {
        Row: {
          id: string
          code: string
          name: string
          discount_type: string
          value: number
          max_discount: number | null
          min_purchase: number
          starts_at: string
          expires_at: string
          usage_limit: number | null
          usage_per_user: number
          used_count: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          discount_type: string
          value: number
          max_discount?: number | null
          min_purchase?: number
          starts_at: string
          expires_at: string
          usage_limit?: number | null
          usage_per_user?: number
          used_count?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          name?: string
          discount_type?: string
          value?: number
          max_discount?: number | null
          min_purchase?: number
          starts_at?: string
          expires_at?: string
          usage_limit?: number | null
          usage_per_user?: number
          used_count?: number
          is_active?: boolean
        }
      }
      districts: {
        Row: {
          id: string
          province_name: string
          city_name: string
          district_name: string
          postal_code: string | null
          zone_id: string | null
        }
        Insert: {
          id?: string
          province_name: string
          city_name: string
          district_name: string
          postal_code?: string | null
          zone_id?: string | null
        }
        Update: {
          province_name?: string
          city_name?: string
          district_name?: string
          postal_code?: string | null
          zone_id?: string | null
        }
      }
      return_requests: {
        Row: {
          id: string
          order_id: string
          user_id: string
          status: string
          reason: string
          customer_notes: string | null
          admin_notes: string | null
          refund_amount: number | null
          refund_bank_name: string | null
          refund_account_number: string | null
          refund_account_name: string | null
          refund_transferred_at: string | null
          approved_at: string | null
          rejected_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          user_id: string
          status?: string
          reason: string
          customer_notes?: string | null
          admin_notes?: string | null
          refund_amount?: number | null
          refund_bank_name?: string | null
          refund_account_number?: string | null
          refund_account_name?: string | null
          refund_transferred_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          reason?: string
          customer_notes?: string | null
          admin_notes?: string | null
          refund_amount?: number | null
          refund_bank_name?: string | null
          refund_account_number?: string | null
          refund_account_name?: string | null
          refund_transferred_at?: string | null
          approved_at?: string | null
          rejected_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      return_items: {
        Row: {
          id: string
          return_request_id: string
          order_item_id: string
          quantity: number
          reason: string | null
        }
        Insert: {
          id?: string
          return_request_id: string
          order_item_id: string
          quantity: number
          reason?: string | null
        }
        Update: {
          return_request_id?: string
          order_item_id?: string
          quantity?: number
          reason?: string | null
        }
      }
      site_settings: {
        Row: {
          key: string
          value: string
          type: string
          group: string
          label: string
        }
        Insert: {
          key: string
          value: string
          type: string
          group: string
          label: string
        }
        Update: {
          key?: string
          value?: string
          type?: string
          group?: string
          label?: string
        }
      }
      redirects: {
        Row: {
          id: string
          from_path: string
          to_path: string
          status_code: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          from_path: string
          to_path: string
          status_code?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          from_path?: string
          to_path?: string
          status_code?: number
          is_active?: boolean
          created_at?: string
        }
      }
      landing_pages: {
        Row: {
          id: string
          slug: string
          title: string
          content: Json
          meta_title: string | null
          meta_description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          content?: Json
          meta_title?: string | null
          meta_description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          content?: Json
          meta_title?: string | null
          meta_description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      admin_activity_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          resource_type: string
          resource_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          resource_type: string
          resource_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          admin_id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          data?: Json | null
          created_at?: string
        }
      }
      shipping_zones: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      shipping_zone_coverage: {
        Row: {
          id: string
          zone_id: string
          province_name: string
        }
        Insert: {
          id?: string
          zone_id: string
          province_name: string
        }
        Update: {
          id?: string
          zone_id?: string
          province_name?: string
        }
      }
      shipping_rates: {
        Row: {
          id: string
          zone_id: string
          courier_name: string
          price_per_kg: number
          min_weight_gram: number
          base_price: number
          etd_days_min: number
          etd_days_max: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          zone_id: string
          courier_name: string
          price_per_kg: number
          min_weight_gram?: number
          base_price: number
          etd_days_min: number
          etd_days_max: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          zone_id?: string
          courier_name?: string
          price_per_kg?: number
          min_weight_gram?: number
          base_price?: number
          etd_days_min?: number
          etd_days_max?: number
          is_active?: boolean
          created_at?: string
        }
      }
      payment_logs: {
        Row: {
          id: string
          payment_id: string | null
          midtrans_order_id: string | null
          event_type: string
          raw_payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          payment_id?: string | null
          midtrans_order_id?: string | null
          event_type: string
          raw_payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          payment_id?: string | null
          midtrans_order_id?: string | null
          event_type?: string
          raw_payload?: Json | null
          created_at?: string
        }
      }
      voucher_usages: {
        Row: {
          id: string
          voucher_id: string
          user_id: string
          order_id: string
          discount_amount: number
          used_at: string
        }
        Insert: {
          id?: string
          voucher_id: string
          user_id: string
          order_id: string
          discount_amount: number
          used_at?: string
        }
        Update: {
          id?: string
          voucher_id?: string
          user_id?: string
          order_id?: string
          discount_amount?: number
          used_at?: string
        }
      }
      notification_templates: {
        Row: {
          id: string
          name: string
          subject: string
          html_body: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subject: string
          html_body: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          html_body?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      return_media: {
        Row: {
          id: string
          return_request_id: string
          url: string
          sort_order: number
        }
        Insert: {
          id?: string
          return_request_id: string
          url: string
          sort_order?: number
        }
        Update: {
          id?: string
          return_request_id?: string
          url?: string
          sort_order?: number
        }
      }
      stock_notifications: {
        Row: {
          id: string
          user_id: string
          variant_id: string
          is_notified: boolean
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          variant_id: string
          is_notified?: boolean
          notified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          variant_id?: string
          is_notified?: boolean
          notified_at?: string | null
          created_at?: string
        }
      }
      search_logs: {
        Row: {
          id: string
          query: string
          results_count: number
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          query: string
          results_count?: number
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          query?: string
          results_count?: number
          user_id?: string | null
          created_at?: string
        }
      }
      rate_limit_logs: {
        Row: {
          key: string
          count: number
          window_start: string
        }
        Insert: {
          key: string
          count?: number
          window_start?: string
        }
        Update: {
          key?: string
          count?: number
          window_start?: string
        }
      }
    }
    Functions: {
      calculate_shipping: {
        Args: { p_zone_id: string; p_weight_gram: number }
        Returns: Json
      }
      validate_voucher: {
        Args: { p_code: string; p_subtotal: number; p_user_id: string }
        Returns: Json
      }
      create_order: {
        Args: {
          p_user_id: string
          p_address_id: string
          p_voucher_code?: string
          p_courier_name?: string
          p_shipping_cost?: number
          p_notes?: string
        }
        Returns: Json
      }
      cancel_order: {
        Args: { p_order_id: string; p_cancel_reason?: string }
        Returns: Json
      }
      adjust_stock: {
        Args: {
          p_variant_id: string
          p_qty: number
          p_note?: string
          p_admin_id?: string
        }
        Returns: Json
      }
      lazy_cancel_expired_orders: {
        Args: { p_user_id: string }
        Returns: Json
      }
      confirm_delivery: {
        Args: { p_order_id: string }
        Returns: Json
      }
    }
    Views: {
      [_ in never]: never
    }
    Enums: {
      [key: string]: string
    }
  }
}

export type Database = {
  public: {
    Tables: {
      [K in keyof RawDatabase['public']['Tables']]: RawDatabase['public']['Tables'][K] & {
        Relationships: []
      }
    }
    Views: RawDatabase['public']['Views']
    Functions: RawDatabase['public']['Functions']
    Enums: RawDatabase['public']['Enums']
  }
}
