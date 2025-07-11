@@ .. @@
 export interface Database {
   public: {
     Tables: {
+      companies: {
+        Row: {
+          id: string
+          name: string
+          email: string | null
+          phone: string | null
+          address: string | null
+          tax_number: string | null
+          logo_url: string | null
+          admin_user_id: string | null
+          created_at: string
+          updated_at: string
+        }
+        Insert: {
+          id?: string
+          name: string
+          email?: string | null
+          phone?: string | null
+          address?: string | null
+          tax_number?: string | null
+          logo_url?: string | null
+          admin_user_id?: string | null
+          created_at?: string
+          updated_at?: string
+        }
+        Update: {
+          id?: string
+          name?: string
+          email?: string | null
+          phone?: string | null
+          address?: string | null
+          tax_number?: string | null
+          logo_url?: string | null
+          admin_user_id?: string | null
+          created_at?: string
+          updated_at?: string
+        }
+      }
+      company_users: {
+        Row: {
+          id: string
+          company_id: string
+          user_id: string
+          role: 'admin' | 'user'
+          permissions: {
+            can_create_quotes: boolean
+            can_edit_own_quotes: boolean
+            can_edit_all_quotes: boolean
+            can_edit_company: boolean
+          }
+          created_at: string
+        }
+        Insert: {
+          id?: string
+          company_id: string
+          user_id: string
+          role?: 'admin' | 'user'
+          permissions?: {
+            can_create_quotes: boolean
+            can_edit_own_quotes: boolean
+            can_edit_all_quotes: boolean
+            can_edit_company: boolean
+          }
+          created_at?: string
+        }
+        Update: {
+          id?: string
+          company_id?: string
+          user_id?: string
+          role?: 'admin' | 'user'
+          permissions?: {
+            can_create_quotes: boolean
+            can_edit_own_quotes: boolean
+            can_edit_all_quotes: boolean
+            can_edit_company: boolean
+          }
+          created_at?: string
+        }
+      }
+      subscriptions: {
+        Row: {
+          id: string
+          company_id: string
+          plan_name: string
+          price: number
+          currency: string
+          status: 'active' | 'inactive' | 'cancelled'
+          starts_at: string
+          ends_at: string | null
+          created_at: string
+          updated_at: string
+        }
+        Insert: {
+          id?: string
+          company_id: string
+          plan_name?: string
+          price?: number
+          currency?: string
+          status?: 'active' | 'inactive' | 'cancelled'
+          starts_at?: string
+          ends_at?: string | null
+          created_at?: string
+          updated_at?: string
+        }
+        Update: {
+          id?: string
+          company_id?: string
+          plan_name?: string
+          price?: number
+          currency?: string
+          status?: 'active' | 'inactive' | 'cancelled'
+          starts_at?: string
+          ends_at?: string | null
+          created_at?: string
+          updated_at?: string
+        }
+      }
+      admin_users: {
+        Row: {
+          id: string
+          user_id: string
+          role: 'super_admin' | 'admin'
+          created_at: string
+        }
+        Insert: {
+          id?: string
+          user_id: string
+          role?: 'super_admin' | 'admin'
+          created_at?: string
+        }
+        Update: {
+          id?: string
+          user_id?: string
+          role?: 'super_admin' | 'admin'
+          created_at?: string
+        }
+      }
       customers: {
         Row: {
           id: string
           name: string
           email: string | null
           phone: string | null
           address: string | null
           tax_number: string | null
-          user_id: string
+          company_id: string | null
           created_at: string
           updated_at: string
         }
         Insert: {
           id?: string
           name: string
           email?: string | null
           phone?: string | null
           address?: string | null
           tax_number?: string | null
-          user_id: string
+          company_id?: string | null
           created_at?: string
           updated_at?: string
         }
         Update: {
           id?: string
           name?: string
           email?: string | null
           phone?: string | null
           address?: string | null
           tax_number?: string | null
-          user_id?: string
+          company_id?: string | null
           created_at?: string
           updated_at?: string
         }
       }
       quotes: {
         Row: {
           id: string
           quote_number: string
           customer_id: string
           items: QuoteItem[]
           subtotal: number
           tax_rate: number
           tax_amount: number
           total: number
           notes: string | null
           valid_until: string | null
           status: 'draft' | 'sent' | 'accepted' | 'rejected'
-          user_id: string
+          company_id: string | null
+          created_by: string | null
           created_at: string
           updated_at: string
         }
         Insert: {
           id?: string
           quote_number: string
           customer_id: string
           items: QuoteItem[]
           subtotal: number
           tax_rate: number
           tax_amount: number
           total: number
           notes?: string | null
           valid_until?: string | null
           status?: 'draft' | 'sent' | 'accepted' | 'rejected'
-          user_id: string
+          company_id?: string | null
+          created_by?: string | null
           created_at?: string
           updated_at?: string
         }
         Update: {
           id?: string
           quote_number?: string
           customer_id?: string
           items?: QuoteItem[]
           subtotal?: number
           tax_rate?: number
           tax_amount?: number
           total?: number
           notes?: string | null
           valid_until?: string | null
           status?: 'draft' | 'sent' | 'accepted' | 'rejected'
-          user_id?: string
+          company_id?: string | null
+          created_by?: string | null
           created_at?: string
           updated_at?: string
         }
       }
     }
   }
 }