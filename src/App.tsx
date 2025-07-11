@@ .. @@
 import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
 import { useAuth } from './hooks/useAuth'
 import { Layout } from './components/Layout'
+import { CompanySetup } from './components/CompanySetup'
+import { UserManagement } from './components/UserManagement'
+import { SuperAdminDashboard } from './components/SuperAdminDashboard'
 import { QuoteList } from './components/QuoteList'
 import { QuoteForm } from './components/QuoteForm'
 import { CustomerList } from './components/CustomerList'
 import { CustomerForm } from './components/CustomerForm'
 import { Settings } from './components/Settings'
 import { Calculator } from './components/Calculator'
 import { Auth } from './components/Auth'
 
 function App() {
-  const { user, loading } = useAuth()
+  const { user, company, loading } = useAuth()
 
   if (loading) {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
       </div>
     )
   }
 
   if (!user) {
     return <Auth />
   }
 
+  // Kullanıcı giriş yapmış ama şirketi yoksa şirket kurulum ekranını göster
+  if (!company) {
+    return <CompanySetup onComplete={() => window.location.reload()} />
+  }
+
   return (
     <Router>
       <Layout>
         <Routes>
           <Route path="/" element={<Navigate to="/quotes" replace />} />
           <Route path="/quotes" element={<QuoteList />} />
           <Route path="/quotes/new" element={<QuoteForm />} />
           <Route path="/quotes/:id/edit" element={<QuoteForm />} />
           <Route path="/customers" element={<CustomerList />} />
           <Route path="/customers/new" element={<CustomerForm />} />
           <Route path="/customers/:id/edit" element={<CustomerForm />} />
+          <Route path="/users" element={<UserManagement />} />
+          <Route path="/super-admin" element={<SuperAdminDashboard />} />
           <Route path="/settings" element={<Settings />} />
           <Route path="/calculator" element={<Calculator />} />
         </Routes>
       </Layout>
     </Router>
   )
 }
 
 export default App