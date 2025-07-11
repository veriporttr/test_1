import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Shield,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { Database } from '../lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']
type Subscription = Database['public']['Tables']['subscriptions']['Row']

interface DashboardStats {
  totalCompanies: number
  totalUsers: number
  totalQuotes: number
  monthlyRevenue: number
  activeSubscriptions: number
}

interface CompanyWithStats extends Company {
  user_count: number
  quote_count: number
  subscription: Subscription | null
}

export function SuperAdminDashboard() {
  const { isSuperAdmin } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalUsers: 0,
    totalQuotes: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0
  })
  const [companies, setCompanies] = useState<CompanyWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSubscription, setShowAddSubscription] = useState<string | null>(null)

  useEffect(() => {
    if (isSuperAdmin) {
      fetchDashboardData()
    }
  }, [isSuperAdmin])

  const fetchDashboardData = async () => {
    try {
      // İstatistikleri al
      const [companiesRes, usersRes, quotesRes, subscriptionsRes] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact' }),
        supabase.from('company_users').select('*', { count: 'exact' }),
        supabase.from('quotes').select('*', { count: 'exact' }),
        supabase.from('subscriptions').select('*').eq('status', 'active')
      ])

      const monthlyRevenue = subscriptionsRes.data?.reduce((sum, sub) => sum + Number(sub.price), 0) || 0

      setStats({
        totalCompanies: companiesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalQuotes: quotesRes.count || 0,
        monthlyRevenue,
        activeSubscriptions: subscriptionsRes.data?.length || 0
      })

      // Şirket detaylarını al
      const { data: companiesData } = await supabase
        .from('companies')
        .select(`
          *,
          subscriptions(*)
        `)

      if (companiesData) {
        const companiesWithStats = await Promise.all(
          companiesData.map(async (company) => {
            const [userCountRes, quoteCountRes] = await Promise.all([
              supabase
                .from('company_users')
                .select('*', { count: 'exact' })
                .eq('company_id', company.id),
              supabase
                .from('quotes')
                .select('*', { count: 'exact' })
                .eq('company_id', company.id)
            ])

            return {
              ...company,
              user_count: userCountRes.count || 0,
              quote_count: quoteCountRes.count || 0,
              subscription: (company as any).subscriptions?.[0] || null
            }
          })
        )

        setCompanies(companiesWithStats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubscription = async (companyId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          company_id: companyId,
          plan_name: 'monthly',
          price: 99.00,
          currency: 'TRY',
          status: 'active'
        })

      if (error) throw error

      setShowAddSubscription(null)
      fetchDashboardData()
      alert('Abonelik başarıyla eklendi!')
    } catch (error) {
      console.error('Error adding subscription:', error)
      alert('Abonelik eklenirken bir hata oluştu')
    }
  }

  const toggleSubscriptionStatus = async (subscriptionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subscriptionId)

      if (error) throw error

      fetchDashboardData()
      alert(`Abonelik durumu ${newStatus === 'active' ? 'aktif' : 'pasif'} olarak güncellendi`)
    } catch (error) {
      console.error('Error updating subscription:', error)
      alert('Abonelik durumu güncellenirken bir hata oluştu')
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Yetkisiz Erişim</h3>
        <p className="mt-1 text-sm text-gray-500">
          Bu sayfaya erişim için süper admin yetkisine sahip olmanız gerekiyor.
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Süper Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sistem geneli istatistikler ve yönetim
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Toplam Şirket
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalCompanies}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Toplam Kullanıcı
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Toplam Teklif
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalQuotes}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aylık Gelir
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ₺{stats.monthlyRevenue.toLocaleString('tr-TR')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aktif Abonelik
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeSubscriptions}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Şirketler Tablosu */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Şirketler
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tüm şirketlerin detaylı bilgileri
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Şirket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teklif Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abonelik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {company.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {company.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.user_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {company.quote_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {company.subscription ? (
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          company.subscription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {company.subscription.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                        <button
                          onClick={() => toggleSubscriptionStatus(company.subscription!.id, company.subscription!.status)}
                          className="ml-2 text-blue-600 hover:text-blue-900"
                        >
                          {company.subscription.status === 'active' ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddSubscription(company.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Abonelik Ekle
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Settings className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Abonelik Ekleme Modal */}
      {showAddSubscription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Abonelik Ekle
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Bu şirkete aylık 99₺ abonelik eklemek istediğinizden emin misiniz?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddSubscription(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleAddSubscription(showAddSubscription)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Abonelik Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}