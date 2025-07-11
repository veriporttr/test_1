@@ .. @@
 import { useEffect, useState } from 'react'
 import { supabase } from '../lib/supabase'
 import type { User } from '@supabase/supabase-js'
+import type { Database } from '../lib/supabase'
+
+type CompanyUser = Database['public']['Tables']['company_users']['Row']
+type Company = Database['public']['Tables']['companies']['Row']
 
 export function useAuth() {
   const [user, setUser] = useState<User | null>(null)
+  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null)
+  const [company, setCompany] = useState<Company | null>(null)
+  const [isAdmin, setIsAdmin] = useState(false)
+  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
   const [loading, setLoading] = useState(true)
 
+  const fetchUserData = async (userId: string) => {
+    try {
+      // Kullanıcının şirket bilgilerini al
+      const { data: companyUserData } = await supabase
+        .from('company_users')
+        .select('*, companies(*)')
+        .eq('user_id', userId)
+        .single()
+
+      if (companyUserData) {
+        setCompanyUser(companyUserData)
+        setCompany(companyUserData.companies as Company)
+        setIsAdmin(companyUserData.role === 'admin')
+      }
+
+      // Super admin kontrolü
+      const { data: adminData } = await supabase
+        .from('admin_users')
+        .select('*')
+        .eq('user_id', userId)
+        .single()
+
+      if (adminData) {
+        setIsSuperAdmin(true)
+      }
+    } catch (error) {
+      console.error('Error fetching user data:', error)
+    }
+  }
+
   useEffect(() => {
     // Get initial session
     supabase.auth.getSession().then(({ data: { session } }) => {
-      setUser(session?.user ?? null)
+      const currentUser = session?.user ?? null
+      setUser(currentUser)
+      if (currentUser) {
+        fetchUserData(currentUser.id)
+      }
       setLoading(false)
     })
 
     // Listen for auth changes
     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
-      setUser(session?.user ?? null)
+      const currentUser = session?.user ?? null
+      setUser(currentUser)
+      if (currentUser) {
+        fetchUserData(currentUser.id)
+      } else {
+        setCompanyUser(null)
+        setCompany(null)
+        setIsAdmin(false)
+        setIsSuperAdmin(false)
+      }
       setLoading(false)
     })
 
@@ -1,7 +1,72 @@
   }, [])
 
   const signOut = async () => {
     await supabase.auth.signOut()
+    setCompanyUser(null)
+    setCompany(null)
+    setIsAdmin(false)
+    setIsSuperAdmin(false)
   }
 
-  return { user, loading, signOut }
+  return { 
+    user, 
+    companyUser, 
+    company, 
+    isAdmin, 
+    isSuperAdmin, 
+    loading, 
+    signOut,
+    refreshUserData: () => user && fetchUserData(user.id)
+  }
 }