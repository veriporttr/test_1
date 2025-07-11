import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { UserPlus, Users, Mail, Shield, Settings, Trash2 } from 'lucide-react'
import type { Database } from '../lib/supabase'

type CompanyUser = Database['public']['Tables']['company_users']['Row'] & {
  user_email?: string
}

export function UserManagement() {
  const { company, isAdmin } = useAuth()
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user')
  const [addingUser, setAddingUser] = useState(false)

  useEffect(() => {
    if (company) {
      fetchUsers()
    }
  }, [company])

  const fetchUsers = async () => {
    if (!company) return

    try {
      const { data, error } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', company.id)

      if (error) throw error

      // Kullanıcı e-postalarını al
      const usersWithEmails = await Promise.all(
        data.map(async (user) => {
          const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
          return {
            ...user,
            user_email: authUser.user?.email
          }
        })
      )

      setUsers(usersWithEmails)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company || !newUserEmail) return

    setAddingUser(true)
    try {
      // Kullanıcıyı davet et (e-posta ile kayıt olması için)
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        newUserEmail,
        {
          data: {
            company_id: company.id,
            role: newUserRole
          }
        }
      )

      if (authError) throw authError

      // Kullanıcıyı company_users tablosuna ekle
      const { error: companyUserError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: authData.user.id,
          role: newUserRole,
          permissions: {
            can_create_quotes: true,
            can_edit_own_quotes: true,
            can_edit_all_quotes: newUserRole === 'admin',
            can_edit_company: newUserRole === 'admin'
          }
        })

      if (companyUserError) throw companyUserError

      setNewUserEmail('')
      setNewUserRole('user')
      setShowAddUser(false)
      fetchUsers()
      alert('Kullanıcı başarıyla davet edildi!')
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Kullanıcı eklenirken bir hata oluştu')
    } finally {
      setAddingUser(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı kaldırmak istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('company_users')
        .delete()
        .eq('user_id', userId)
        .eq('company_id', company?.id)

      if (error) throw error

      fetchUsers()
      alert('Kullanıcı başarıyla kaldırıldı')
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Kullanıcı kaldırılırken bir hata oluştu')
    }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('company_users')
        .update({
          role: newRole,
          permissions: {
            can_create_quotes: true,
            can_edit_own_quotes: true,
            can_edit_all_quotes: newRole === 'admin',
            can_edit_company: newRole === 'admin'
          }
        })
        .eq('user_id', userId)
        .eq('company_id', company?.id)

      if (error) throw error

      fetchUsers()
      alert('Kullanıcı rolü güncellendi')
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Kullanıcı rolü güncellenirken bir hata oluştu')
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Yetkisiz Erişim</h3>
        <p className="mt-1 text-sm text-gray-500">
          Bu sayfaya erişim için admin yetkisine sahip olmanız gerekiyor.
        </p>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="mt-1 text-sm text-gray-500">
            Şirketinizin kullanıcılarını yönetin
          </p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Kullanıcı Ekle
        </button>
      </div>

      {showAddUser && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Kullanıcı Ekle</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta Adresi
              </label>
              <input
                type="email"
                id="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="kullanici@ornek.com"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                id="role"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="user">Kullanıcı</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={addingUser}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {addingUser ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {user.user_email}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Katılım: {new Date(user.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.user_id, e.target.value as 'admin' | 'user')}
                    className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleRemoveUser(user.user_id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}