@@ .. @@
 import React, { useState, useEffect } from 'react'
 import { useNavigate, useParams } from 'react-router-dom'
 import { supabase } from '../lib/supabase'
 import { useAuth } from '../hooks/useAuth'
 import { Plus, Minus, Save, ArrowLeft } from 'lucide-react'
 import type { Database } from '../lib/supabase'
 
 type Customer = Database['public']['Tables']['customers']['Row']
 type Quote = Database['public']['Tables']['quotes']['Row']
 type QuoteItem = Database['public']['Tables']['quotes']['Row']['items'][0]
 
 export function QuoteForm() {
-  const { user } = useAuth()
+  const { user, company, companyUser } = useAuth()
   const navigate = useNavigate()
   const { id } = useParams()
   const isEditing = Boolean(id)
 
   const [customers, setCustomers] = useState<Customer[]>([])
   const [loading, setLoading] = useState(false)
   const [loadingCustomers, setLoadingCustomers] = useState(true)
+  const [canEdit, setCanEdit] = useState(true)
   const [formData, setFormData] = useState({
     quote_number: '',
     customer_id: '',
     items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }] as QuoteItem[],
     tax_rate: 20,
     notes: '',
     valid_until: '',
     status: 'draft' as const
   })
 
   useEffect(() => {
     fetchCustomers()
     if (isEditing) {
       fetchQuote()
     } else {
       generateQuoteNumber()
     }
   }, [id])
 
   const fetchCustomers = async () => {
-    if (!user) return
+    if (!company) return
 
     try {
       const { data, error } = await supabase
         .from('customers')
         .select('*')
-        .eq('user_id', user.id)
+        .eq('company_id', company.id)
         .order('name')
 
       if (error) throw error
       setCustomers(data || [])
     } catch (error) {
       console.error('Error fetching customers:', error)
     } finally {
       setLoadingCustomers(false)
     }
   }
 
   const fetchQuote = async () => {
-    if (!user || !id) return
+    if (!company || !id) return
 
     try {
       const { data, error } = await supabase
         .from('quotes')
         .select('*')
         .eq('id', id)
-        .eq('user_id', user.id)
+        .eq('company_id', company.id)
         .single()
 
       if (error) throw error
 
+      // Düzenleme yetkisi kontrolü
+      const canEditQuote = companyUser?.permissions?.can_edit_all_quotes || 
+                          (companyUser?.permissions?.can_edit_own_quotes && data.created_by === user?.id)
+      setCanEdit(canEditQuote || false)
+
       setFormData({
         quote_number: data.quote_number,
         customer_id: data.customer_id,
         items: data.items,
         tax_rate: data.tax_rate,
         notes: data.notes || '',
         valid_until: data.valid_until ? data.valid_until.split('T')[0] : '',
         status: data.status
       })
     } catch (error) {
       console.error('Error fetching quote:', error)
       navigate('/quotes')
     }
   }
 
   const generateQuoteNumber = async () => {
-    if (!user) return
+    if (!company) return
 
     try {
       const { data, error } = await supabase
         .from('quotes')
         .select('quote_number')
-        .eq('user_id', user.id)
+        .eq('company_id', company.id)
         .order('created_at', { ascending: false })
         .limit(1)
 
       if (error) throw error
 
       const lastQuoteNumber = data?.[0]?.quote_number
       let nextNumber = 1
 
       if (lastQuoteNumber) {
         const match = lastQuoteNumber.match(/(\d+)$/)
         if (match) {
           nextNumber = parseInt(match[1]) + 1
         }
       }
 
       setFormData(prev => ({
         ...prev,
         quote_number: `TKL-${nextNumber.toString().padStart(4, '0')}`
       }))
     } catch (error) {
       console.error('Error generating quote number:', error)
     }
   }
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault()
-    if (!user) return
+    if (!user || !company) return
+
+    // Yetki kontrolü
+    if (isEditing && !canEdit) {
+      alert('Bu teklifi düzenleme yetkiniz yok')
+      return
+    }
+
+    if (!isEditing && !companyUser?.permissions?.can_create_quotes) {
+      alert('Teklif oluşturma yetkiniz yok')
+      return
+    }
 
     setLoading(true)
     try {
       const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0)
       const tax_amount = (subtotal * formData.tax_rate) / 100
       const total = subtotal + tax_amount
 
       const quoteData = {
         ...formData,
         subtotal,
         tax_amount,
         total,
-        user_id: user.id,
+        company_id: company.id,
+        created_by: user.id,
         valid_until: formData.valid_until || null
       }
 
       if (isEditing) {
         const { error } = await supabase
           .from('quotes')
           .update(quoteData)
           .eq('id', id)
-          .eq('user_id', user.id)
+          .eq('company_id', company.id)
 
         if (error) throw error
       } else {
         const { error } = await supabase
           .from('quotes')
           .insert(quoteData)
 
         if (error) throw error
       }
 
       navigate('/quotes')
     } catch (error) {
       console.error('Error saving quote:', error)
       alert('Teklif kaydedilirken bir hata oluştu')
     } finally {
       setLoading(false)
     }
   }
 
+  if (isEditing && !canEdit) {
+    return (
+      <div className="text-center py-12">
+        <h3 className="mt-2 text-sm font-medium text-gray-900">Düzenleme Yetkisi Yok</h3>
+        <p className="mt-1 text-sm text-gray-500">
+          Bu teklifi düzenleme yetkiniz bulunmuyor.
+        </p>
+        <button
+          onClick={() => navigate('/quotes')}
+          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
+        >
+          <ArrowLeft className="w-4 h-4 mr-2" />
+          Geri Dön
+        </button>
+      </div>
+    )
+  }
+
   // ... rest of the component remains the same