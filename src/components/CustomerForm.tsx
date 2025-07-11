import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Save, ArrowLeft } from 'lucide-react'
import type { Database } from '../lib/supabase'

type Customer = Database['public']['Tables']['customers']['Row']

export function CustomerForm() {
  const { company } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax_number: ''
  })

  useEffect(() => {
    if (isEditing) {
      fetchCustomer()
    }
  }, [id])

  const fetchCustomer = async () => {
    if (!company || !id) return

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('company_id', company.id)
        .single()

      if (error) throw error

      setFormData({
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        tax_number: data.tax_number || ''
      })
    } catch (error) {
      console.error('Error fetching customer:', error)
      navigate('/customers')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return

    setLoading(true)
    try {
      const customerData = {
        ...formData,
        company_id: company.id
      }

      if (isEditing) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', id)
          .eq('company_id', company.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customers')
          .insert(customerData)

        if (error) throw error
      }

      navigate('/customers')
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Müşteri kaydedilirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // ... rest of the component remains the same
}