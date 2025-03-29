'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, GraduationCap, Phone, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface Department {
  id: string
  name: string
}

interface Student {
  id: string
  name: string
  surname: string
  phone: string
  department_id: string
  active: boolean
}

export default function EditStudent({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<Student>({
    id: params.id,
    name: '',
    surname: '',
    phone: '',
    department_id: '',
    active: true
  })

  useEffect(() => {
    fetchDepartments()
    fetchStudent()
  }, [])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (err: any) {
      console.error('Bölümler yüklenirken hata:', err)
      toast.error('Bölümler yüklenirken bir hata oluştu')
    }
  }

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) {
        toast.error('Öğrenci bulunamadı')
        router.push('/panel/ogrenciler')
        return
      }

      setFormData(data)
    } catch (err: any) {
      console.error('Öğrenci bilgileri yüklenirken hata:', err)
      toast.error('Öğrenci bilgileri yüklenirken bir hata oluştu')
      router.push('/panel/ogrenciler')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Lütfen öğrencinin adını giriniz')
      return false
    }
    if (!formData.surname.trim()) {
      toast.error('Lütfen öğrencinin soyadını giriniz')
      return false
    }
    if (!formData.phone.trim()) {
      toast.error('Lütfen telefon numarasını giriniz')
      return false
    }
    if (!formData.department_id) {
      toast.error('Lütfen bir bölüm seçiniz')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          phone: formData.phone.trim(),
          department_id: formData.department_id,
          active: formData.active
        })
        .eq('id', params.id)

      if (error) throw error

      toast.success('Öğrenci bilgileri güncellendi')
      router.push('/panel/ogrenciler')
    } catch (err: any) {
      console.error('Öğrenci güncellenirken hata:', err)
      toast.error('Öğrenci güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Üst Kısım */}
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>Geri Dön</span>
        </button>
        
        <h1 className="text-3xl font-bold text-slate-800">Öğrenci Düzenle</h1>
        <p className="text-slate-500 mt-1">Öğrenci bilgilerini güncelleyin</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 space-y-6">
            {/* Ad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ad
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Öğrencinin adı"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Soyad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Soyad
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  placeholder="Öğrencinin soyadı"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Telefon
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0555 555 55 55"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Bölüm */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bölüm
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Bölüm Seçin</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Durum */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Durum
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.active}
                    onChange={() => setFormData({ ...formData, active: true })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Aktif</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.active}
                    onChange={() => setFormData({ ...formData, active: false })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Pasif</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 