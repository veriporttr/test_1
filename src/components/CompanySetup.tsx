import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Building2, Save } from 'lucide-react'

interface CompanySetupProps {
  onComplete: () => void
}

export function CompanySetup({ onComplete }: CompanySetupProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_number: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Şirket oluştur
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...formData,
          admin_user_id: user.id
        })
        .select()
        .single()

      if (companyError) throw companyError

      // Kullanıcıyı şirket adminı olarak ekle
      const { error: userError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: 'admin',
          permissions: {
            can_create_quotes: true,
            can_edit_own_quotes: true,
            can_edit_all_quotes: true,
            can_edit_company: true
          }
        })

      if (userError) throw userError

      // Abonelik oluştur
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          company_id: company.id,
          plan_name: 'monthly',
          price: 99.00,
          currency: 'TRY',
          status: 'active'
        })

      if (subscriptionError) throw subscriptionError

      onComplete()
    } catch (error) {
      console.error('Error creating company:', error)
      alert('Şirket oluşturulurken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Şirket Bilgilerinizi Girin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hesabınızı kullanmaya başlamak için şirket bilgilerinizi tamamlayın
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Şirket Adı *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Şirket adınızı girin"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="ornek@sirket.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="+90 555 123 45 67"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Adres
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Şirket adresinizi girin"
              />
            </div>

            <div>
              <label htmlFor="tax_number" className="block text-sm font-medium text-gray-700">
                Vergi Numarası
              </label>
              <input
                id="tax_number"
                name="tax_number"
                type="text"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Kaydediliyor...' : 'Şirketi Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}