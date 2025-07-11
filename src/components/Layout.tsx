@@ .. @@
 import React from 'react'
 import { Link, useLocation } from 'react-router-dom'
 import { useAuth } from '../hooks/useAuth'
-import { FileText, Users, Settings, LogOut, Calculator } from 'lucide-react'
+import { FileText, Users, Settings, LogOut, Calculator, Shield, Building2 } from 'lucide-react'
 
 interface LayoutProps {
   children: React.ReactNode
 }
 
 export function Layout({ children }: LayoutProps) {
-  const { user, signOut } = useAuth()
+  const { user, company, isAdmin, isSuperAdmin, signOut } = useAuth()
   const location = useLocation()
 
   const navigation = [
     { name: 'Teklifler', href: '/quotes', icon: FileText },
     { name: 'Müşteriler', href: '/customers', icon: Users },
     { name: 'Hesap Makinesi', href: '/calculator', icon: Calculator },
-    { name: 'Ayarlar', href: '/settings', icon: Settings },
+    ...(isAdmin ? [{ name: 'Kullanıcı Yönetimi', href: '/users', icon: Users }] : []),
+    { name: 'Ayarlar', href: '/settings', icon: Settings }
   ]
 
+  const superAdminNavigation = [
+    { name: 'Süper Admin', href: '/super-admin', icon: Shield }
+  ]
+
   return (
     <div className="min-h-screen bg-gray-50">
       <div className="flex">
         {/* Sidebar */}
         <div className="hidden md:flex md:w-64 md:flex-col">
           <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r border-gray-200">
             <div className="flex items-center flex-shrink-0 px-4">
-              <h1 className="text-xl font-bold text-gray-900">Teklif Sistemi</h1>
+              <div>
+                <h1 className="text-xl font-bold text-gray-900">Teklif Sistemi</h1>
+                {company && (
+                  <p className="text-sm text-gray-500 mt-1">{company.name}</p>
+                )}
+              </div>
             </div>
             <div className="mt-5 flex-grow flex flex-col">
               <nav className="flex-1 px-2 pb-4 space-y-1">
                 {navigation.map((item) => {
                   const isActive = location.pathname === item.href
                   return (
                     <Link
                       key={item.name}
                       to={item.href}
                       className={`${
                         isActive
                           ? 'bg-blue-50 border-blue-500 text-blue-700'
                           : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                       } group flex items-center pl-3 pr-2 py-2 border-l-4 text-sm font-medium`}
                     >
                       <item.icon
                         className={`${
                           isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                         } mr-3 h-5 w-5`}
                       />
                       {item.name}
                     </Link>
                   )
                 })}
+                
+                {isSuperAdmin && (
+                  <div className="pt-4 mt-4 border-t border-gray-200">
+                    {superAdminNavigation.map((item) => {
+                      const isActive = location.pathname === item.href
+                      return (
+                        <Link
+                          key={item.name}
+                          to={item.href}
+                          className={`${
+                            isActive
+                              ? 'bg-purple-50 border-purple-500 text-purple-700'
+                              : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
+                          } group flex items-center pl-3 pr-2 py-2 border-l-4 text-sm font-medium`}
+                        >
+                          <item.icon
+                            className={`${
+                              isActive ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'
+                            } mr-3 h-5 w-5`}
+                          />
+                          {item.name}
+                        </Link>
+                      )
+                    })}
+                  </div>
+                )}
               </nav>
               <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                 <div className="flex items-center">
                   <div className="ml-3">
                     <p className="text-sm font-medium text-gray-700">{user?.email}</p>
+                    {company && (
+                      <p className="text-xs text-gray-500">{company.name}</p>
+                    )}
                   </div>
                 </div>
                 <button
                   onClick={signOut}
                   className="ml-auto flex-shrink-0 bg-white p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                 >
                   <LogOut className="h-5 w-5" />
                 </button>
               </div>
             </div>
           </div>
         </div>
 
         {/* Main content */}
         <div className="flex flex-col flex-1">
           <main className="flex-1">
             <div className="py-6">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                 {children}
               </div>
             </div>
           </main>
         </div>
       </div>
     </div>
   )
 }