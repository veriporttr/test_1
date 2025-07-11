@@ .. @@
 import React, { useState, useEffect } from 'react'
 import { Link } from 'react-router-dom'
 import { supabase } from '../lib/supabase'
 import { useAuth } from '../hooks/useAuth'
 import { Plus, Edit, Trash2, Eye, FileText } from 'lucide-react'
 import type { Database } from '../lib/supabase'
 
 type Quote = Database['public']['Tables']['quotes']['Row'] & {
   customers: { name: string } | null
+  created_by_email?: string
 }
 
 export function QuoteList() {
-  const { user } = useAuth()
+  const { user, company, companyUser } = useAuth()
   const [quotes, setQuotes] = useState<Quote[]>([])
   const [loading, setLoading] = useState(true)
 
   useEffect(() => {
-    if (user) {
+    if (company) {
       fetchQuotes()
     }
-  }, [user])
+  }, [company])
 
   const fetchQuotes = async () => {
-    if (!user) return
+    if (!company) return
 
     try {
       const { data, error } = await supabase
         .from('quotes')
         .select(`
           *,
           customers (name)
         `)
-        .eq('user_id', user.id)
+        .eq('company_id', company.id)
         .order('created_at', { ascending: false })
 
       if (error) throw error
-      setQuotes(data || [])
+
+      // Oluşturan kullanıcının e-postasını al
+      const quotesWithCreator = await Promise.all(
+        (data || []).map(async (quote) => {
+          if (quote.created_by) {
+            const { data: userData } = await supabase.auth.admin.getUserById(quote.created_by)
+            return {
+              ...quote,
+              created_by_email: userData.user?.email
+            }
+          }
+          return quote
+        })
+      )
+
+      setQuotes(quotesWithCreator)
     } catch (error) {
       console.error('Error fetching quotes:', error)
     } finally {
       setLoading(false)
     }
   }
 
   const handleDelete = async (id: string) => {
+    const quote = quotes.find(q => q.id === id)
+    if (!quote) return
+
+    // Silme yetkisi kontrolü
+    const canDelete = companyUser?.permissions?.can_edit_all_quotes || 
+                     (companyUser?.permissions?.can_edit_own_quotes && quote.created_by === user?.id)
+    
+    if (!canDelete) {
+      alert('Bu teklifi silme yetkiniz yok')
+      return
+    }
+
     if (!confirm('Bu teklifi silmek istediğinizden emin misiniz?')) return
 
     try {
       const { error } = await supabase
         .from('quotes')
         .delete()
         .eq('id', id)
-        .eq('user_id', user?.id)
+        .eq('company_id', company?.id)
 
       if (error) throw error
       fetchQuotes()
     } catch (error) {
       console.error('Error deleting quote:', error)
       alert('Teklif silinirken bir hata oluştu')
     }
   }
 
+  const canEditQuote = (quote: Quote) => {
+    return companyUser?.permissions?.can_edit_all_quotes || 
+           (companyUser?.permissions?.can_edit_own_quotes && quote.created_by === user?.id)
+  }
+
+  const canCreateQuotes = companyUser?.permissions?.can_create_quotes
+
   if (loading) {
     return (
       <div className="flex items-center justify-center py-12">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
       </div>
     )
   }
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-gray-900">Teklifler</h1>
           <p className="mt-1 text-sm text-gray-500">
             Tüm tekliflerinizi buradan yönetebilirsiniz
           </p>
         </div>
-        <Link
-          to="/quotes/new"
-          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
-        >
-          <Plus className="w-4 h-4 mr-2" />
-          Yeni Teklif
-        </Link>
+        {canCreateQuotes && (
+          <Link
+            to="/quotes/new"
+            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
+          >
+            <Plus className="w-4 h-4 mr-2" />
+            Yeni Teklif
+          </Link>
+        )}
       </div>
 
       {quotes.length === 0 ? (
         <div className="text-center py-12">
           <FileText className="mx-auto h-12 w-12 text-gray-400" />
           <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz teklif yok</h3>
           <p className="mt-1 text-sm text-gray-500">
-            İlk teklifinizi oluşturarak başlayın.
+            {canCreateQuotes ? 'İlk teklifinizi oluşturarak başlayın.' : 'Henüz hiç teklif oluşturulmamış.'}
           </p>
-          <div className="mt-6">
-            <Link
-              to="/quotes/new"
-              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
-            >
-              <Plus className="w-4 h-4 mr-2" />
-              Yeni Teklif
-            </Link>
-          </div>
+          {canCreateQuotes && (
+            <div className="mt-6">
+              <Link
+                to="/quotes/new"
+                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
+              >
+                <Plus className="w-4 h-4 mr-2" />
+                Yeni Teklif
+              </Link>
+            </div>
+          )}
         </div>
       ) : (
         <div className="bg-white shadow overflow-hidden sm:rounded-md">
           <ul className="divide-y divide-gray-200">
             {quotes.map((quote) => (
               <li key={quote.id}>
                 <div className="px-4 py-4 flex items-center justify-between">
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between">
                       <p className="text-sm font-medium text-blue-600 truncate">
                         {quote.quote_number}
                       </p>
                       <div className="ml-2 flex-shrink-0 flex">
                         <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           quote.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                           quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                           quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                           'bg-red-100 text-red-800'
                         }`}>
                           {quote.status === 'draft' ? 'Taslak' :
                            quote.status === 'sent' ? 'Gönderildi' :
                            quote.status === 'accepted' ? 'Kabul Edildi' :
                            'Reddedildi'}
                         </p>
                       </div>
                     </div>
                     <div className="mt-2 flex items-center text-sm text-gray-500">
                       <p className="truncate">
                         Müşteri: {quote.customers?.name || 'Bilinmiyor'}
                       </p>
                       <span className="mx-2">•</span>
                       <p>₺{quote.total.toLocaleString('tr-TR')}</p>
+                      {quote.created_by_email && (
+                        <>
+                          <span className="mx-2">•</span>
+                          <p>Oluşturan: {quote.created_by_email}</p>
+                        </>
+                      )}
                     </div>
                   </div>
                   <div className="flex items-center space-x-2">
-                    <Link
-                      to={`/quotes/${quote.id}/edit`}
-                      className="text-blue-600 hover:text-blue-900"
-                    >
-                      <Edit className="h-4 w-4" />
-                    </Link>
+                    {canEditQuote(quote) && (
+                      <Link
+                        to={`/quotes/${quote.id}/edit`}
+                        className="text-blue-600 hover:text-blue-900"
+                      >
+                        <Edit className="h-4 w-4" />
+                      </Link>
+                    )}
                     <button
                       onClick={() => handleDelete(quote.id)}
                       className="text-red-600 hover:text-red-900"
+                      disabled={!canEditQuote(quote)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 </div>
               </li>
             ))}
           </ul>
         </div>
       )}
     </div>
   )
 }