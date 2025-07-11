import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Save, User, Building2, CreditCard } from 'lucide-react'
import type { Database } from '../lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']
type Subscription = Database['public']['Tables']['subscriptions']['Row']

export function Settings() {
  const { user, company, isAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [companyData, setCompanyData] = useState<Company | null>(null)
  const [formData, setFormData] = useState({
    email: user?.email || '',
    full_name: '',
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    company_tax_number: ''
  })

  useEffect(() => {
    if (company) {
      fetchCompanyData()
      fetchSubscription()
      setFormData(prev => ({
        ...prev,
        company_name: company.name,
        company_email: company.email || '',
        company_phone: company.phone || '',
        company_address: company.address || '',
        company_tax_number: company.tax_number || ''
      }))
    }
  }, [company])

  const fetchCompanyData = async () => {
    if (!company) return

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', company.id)
        .single()

      if (error) throw error
      setCompanyData(data)
    } catch (error) {
      console.error('Error fetching company data:', error)
    }
  }

  const fetchSubscription = async () => {
    if (!company) return

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', company.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company || !isAdmin) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: formData.company_name,
          email: formData.company_email,
          phone: formData.company_phone,
          address: formData.company_address,
          tax_number: formData.company_tax_number
        })
        .eq('id', company.id)

      if (error) throw error
      alert('Şirket bilgileri başarıyla güncellendi!')
      fetchCompanyData()
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Şirket bilgileri güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hesap ve şirket ayarlarınızı yönetin
        </p>
      </div>

      {/* Abonelik Bilgileri */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <CreditCard className="h-6 w-6 text-gray-400 mr-3" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Abonelik Bilgileri
            </h3>
          </div>
          
          {subscription ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">Aktif Abonelik</p>
                  <p className="text-sm text-green-600">Aylık Plan - ₺99/ay</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Aktif
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <p>Başlangıç: {new Date(subscription.starts_at).toLocaleDateString('tr-TR')}</p>
                {subscription.ends_at && (
                  <p>Bitiş: {new Date(subscription.ends_at).toLocaleDateString('tr-TR')}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Aktif Abonelik Yok</p>
              <p className="text-sm text-yellow-600">Sistem yöneticinizle iletişime geçin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Şirket Ayarları - Sadece Admin */}
      {isAdmin && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <Building2 className="h-6 w-6 text-gray-400 mr-3" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Şirket Bilgileri
              </h3>
            </div>

            <form onSubmit={handleCompanySubmit} className="space-y-6">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Şirket Adı
                </label>
                <input
                  type="text"
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="company_email" className="block text-sm font-medium text-gray-700">
                  Şirket E-postası
                </label>
                <input
                  type="email"
                  id="company_email"
                  value={formData.company_email}
                  onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700">
                  Telefon
                </label>
                <input
                  type="tel"
                  id="company_phone"
                  value={formData.company_phone}
                  onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="company_address" className="block text-sm font-medium text-gray-700">
                  Adres
                </label>
                <textarea
                  id="company_address"
                  rows={3}
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="company_tax_number" className="block text-sm font-medium text-gray-700">
                  Vergi Numarası
                </label>
                <input
                  type="text"
                  id="company_tax_number"
                  value={formData.company_tax_number}
                  onChange={(e) => setFormData({ ...formData, company_tax_number: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kullanıcı Bilgileri */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-gray-400 mr-3" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Kullanıcı Bilgileri
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-posta
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                E-posta adresi değiştirilemez
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}