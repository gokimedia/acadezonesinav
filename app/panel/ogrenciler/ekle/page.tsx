'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  User, 
  Phone, 
  GraduationCap, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Department {
  id: string
  name: string
}

export default function AddStudent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    department_id: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (err: any) {
      console.error('Error fetching departments:', err)
      toast.error('Bölümler yüklenirken bir hata oluştu')
    }
  }

  // Bölümleri yükle
  useEffect(() => {
    fetchDepartments()
  }, []) // Boş dependency array ile sadece component mount olduğunda çalışır

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Ad alanı zorunludur'
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Soyad alanı zorunludur'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon alanı zorunludur'
    } else if (!/^\d{10,11}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz'
    }
    if (!formData.department_id) {
      newErrors.department_id = 'Bölüm seçimi zorunludur'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Rastgele öğrenci kodu oluşturma fonksiyonu ekleyelim
  const generateStudentCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Benzer karakterleri (0, O, 1, I) çıkardık
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Lütfen tüm zorunlu alanları doldurun')
      return
    }

    setLoading(true)
    const loadingToast = toast.loading('Öğrenci kaydediliyor...')

    try {
      // Öğrenci için benzersiz kod oluştur
      const student_code = generateStudentCode();
      
      const { data, error } = await supabase
        .from('students')
        .insert([{
          ...formData,
          student_code, // Oluşturduğumuz kodu ekliyoruz
          active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      toast.dismiss(loadingToast)
      toast.success('Öğrenci başarıyla eklendi')
      router.push('/panel/ogrenciler')
    } catch (err: any) {
      toast.dismiss(loadingToast)
      console.error('Error adding student:', err)
      toast.error('Öğrenci eklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Değişiklik yapıldığında ilgili hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-slate-800">
                Yeni Öğrenci Ekle
              </h1>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors shadow-sm ${
                loading 
                  ? 'bg-blue-500/80 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6">
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 rounded-full text-blue-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Sınav Giriş Kodu</h3>
                  <p className="mt-1 text-xs text-blue-600">
                    Öğrenci kaydedildiğinde, sınav girişi için otomatik bir kod oluşturulacaktır. 
                    Bu kod öğrenciye iletilmeli ve sınava giriş yaparken kullanılmalıdır.
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ad Soyad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-4 py-2.5 text-slate-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-slate-200 bg-slate-50'
                      }`}
                      placeholder="Öğrencinin adı"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Soyad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-4 py-2.5 text-slate-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.surname 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-slate-200 bg-slate-50'
                      }`}
                      placeholder="Öğrencinin soyadı"
                    />
                  </div>
                  {errors.surname && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.surname}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-4 py-2.5 text-slate-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-200 bg-slate-50'
                    }`}
                    placeholder="5XX XXX XX XX"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Bölüm */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bölüm <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-4 py-2.5 text-slate-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.department_id 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <option value="">Bölüm seçin</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.department_id && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.department_id}</span>
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Geri Dön</span>
              </button>
              
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-red-500">*</span>
                <span>ile işaretli alanlar zorunludur</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 