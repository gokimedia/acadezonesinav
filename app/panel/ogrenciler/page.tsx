'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Menu, Transition } from '@headlessui/react'
import { 
  Search,
  Plus,
  Trash2,
  Edit2,
  UserPlus,
  GraduationCap,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  MoreVertical,
  Download,
  UserX,
  FilePlus,
  UploadCloud,
  Loader2,
  X,
  ChevronDown,
  ListFilter,
  LayoutGrid,
  LayoutList,
  AlertCircle,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Student {
  id: string
  name: string
  surname: string
  phone: string
  department_id: string
  department?: {
    name: string
  }
  created_at: string
  active: boolean
  student_code: string
}

interface Department {
  id: string
  name: string
}

interface StudentStats {
  total: number
  active: number
  inactive: number
  byDepartment: Record<string, number>
}

export default function Students() {
  // Core state
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // Student action states
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({})
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  
  // Filtering and sorting states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<'name' | 'created_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Apply filtering and sorting
  const filteredStudents = useMemo(() => {
    // First filter
    let result = students.filter(student => {
      const matchesSearch = searchTerm === '' || (
        `${student.name} ${student.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm) ||
        (student.department?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )

      const matchesDepartment = !selectedDepartment || student.department_id === selectedDepartment
      const matchesActive = activeFilter === null || student.active === activeFilter

      return matchesSearch && matchesDepartment && matchesActive
    })
    
    // Then sort
    result = [...result].sort((a, b) => {
      if (sortField === 'name') {
        const nameA = `${a.name} ${a.surname}`.toLowerCase()
        const nameB = `${b.name} ${b.surname}`.toLowerCase()
        return sortDirection === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      } else {
        // Sort by created_at date
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    
    return result
  }, [students, searchTerm, selectedDepartment, activeFilter, sortField, sortDirection])

  // Initial data fetch
  useEffect(() => {
    fetchDepartments()
    fetchStudents()
  }, [])

  // Select all checkbox logic
  useEffect(() => {
    if (filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length) {
      setIsAllSelected(true)
    } else {
      setIsAllSelected(false)
    }
  }, [selectedStudents, filteredStudents])

  // Calculate student statistics
  const studentStats: StudentStats = useMemo(() => {
    const stats = {
      total: students.length,
      active: students.filter(s => s.active).length,
      inactive: students.filter(s => !s.active).length,
      byDepartment: {} as Record<string, number>
    }

    // Group by department
    students.forEach(student => {
      const deptId = student.department_id
      const deptName = student.department?.name || 'Bilinmeyen'
      
      if (!stats.byDepartment[deptId]) {
        stats.byDepartment[deptId] = 0
      }
      stats.byDepartment[deptId]++
    })

    return stats
  }, [students])

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

  const fetchStudents = async () => {
    const loadingToast = toast.loading('Öğrenciler yükleniyor...')
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          department:departments(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Öğrenci kodu olmayan öğrencilere kod atayalım
      const updatedStudents = [];
      
      for (const student of data || []) {
        if (!student.student_code) {
          // Daha güvenli 6 karakterlik kod oluştur
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Benzer karakterleri (0, O, 1, I) çıkardık
          let newCode = '';
          for (let i = 0; i < 6; i++) {
            newCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          // Sadece student_code alanını güncelle
          const { error: updateError } = await supabase
            .from('students')
            .update({ student_code: newCode })
            .eq('id', student.id);
            
          if (updateError) {
            console.error('Öğrenci kodu güncellenirken hata:', JSON.stringify(updateError, null, 2));
          } else {
            student.student_code = newCode; // Yerel state'i güncelle
            updatedStudents.push(student);
          }
        }
      }
      
      if (updatedStudents.length > 0) {
        console.log(`${updatedStudents.length} öğrencinin kodu başarıyla güncellendi`);
      }
        
      setStudents(data || [])
      toast.dismiss(loadingToast)
    } catch (err: any) {
      toast.dismiss(loadingToast)
      console.error('Error fetching students:', err)
      setError(err.message || 'Öğrenciler yüklenirken bir hata oluştu')
      toast.error('Öğrenciler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (studentId: string, newStatus: boolean) => {
    // Track processing state for this specific student
    setProcessingIds(prev => ({ ...prev, [studentId]: true }))
    
    try {
      const { error } = await supabase
        .from('students')
        .update({ active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', studentId)

      if (error) throw error

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, active: newStatus }
          : student
      ))

      toast.success(`Öğrenci durumu ${newStatus ? 'aktif' : 'pasif'} olarak güncellendi`)
    } catch (err: any) {
      console.error('Error updating status:', err)
      toast.error('Durum güncellenirken bir hata oluştu')
    } finally {
      // Remove from processing state
      setProcessingIds(prev => {
        const updated = { ...prev }
        delete updated[studentId]
        return updated
      })
    }
  }

  const handleDelete = async (studentId: string) => {
    if (!window.confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.')) {
      return
    }

    setProcessingIds(prev => ({ ...prev, [studentId]: true }))
    
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) throw error

      // Remove from selected list if present
      if (selectedStudents.includes(studentId)) {
        setSelectedStudents(selectedStudents.filter(id => id !== studentId))
      }
      
      // Remove from student list
      setStudents(students.filter(student => student.id !== studentId))
      toast.success('Öğrenci başarıyla silindi')
    } catch (err: any) {
      console.error('Error deleting student:', err)
      toast.error('Öğrenci silinirken bir hata oluştu')
    } finally {
      setProcessingIds(prev => {
        const updated = { ...prev }
        delete updated[studentId]
        return updated
      })
    }
  }

  // Handle bulk status change
  const handleBulkStatusChange = async (newStatus: boolean) => {
    if (selectedStudents.length === 0) return
    
    if (!window.confirm(`Seçili ${selectedStudents.length} öğrencinin durumunu ${newStatus ? 'aktif' : 'pasif'} yapmak istediğinizden emin misiniz?`)) {
      return
    }
    
    const loadingToast = toast.loading(`${selectedStudents.length} öğrenci güncelleniyor...`)
    
    try {
      const { error } = await supabase
        .from('students')
        .update({ active: newStatus, updated_at: new Date().toISOString() })
        .in('id', selectedStudents)

      if (error) throw error

      // Update local state
      setStudents(students.map(student => 
        selectedStudents.includes(student.id)
          ? { ...student, active: newStatus }
          : student
      ))

      toast.dismiss(loadingToast)
      toast.success(`${selectedStudents.length} öğrenci başarıyla güncellendi`)
      setSelectedStudents([]) // Clear selection
    } catch (err: any) {
      toast.dismiss(loadingToast)
      console.error('Error updating multiple students:', err)
      toast.error('Öğrenciler güncellenirken bir hata oluştu')
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return
    
    if (!window.confirm(`Seçili ${selectedStudents.length} öğrenciyi silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) {
      return
    }
    
    const loadingToast = toast.loading(`${selectedStudents.length} öğrenci siliniyor...`)
    
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .in('id', selectedStudents)

      if (error) throw error

      // Update local state
      setStudents(students.filter(student => !selectedStudents.includes(student.id)))
      
      toast.dismiss(loadingToast)
      toast.success(`${selectedStudents.length} öğrenci başarıyla silindi`)
      setSelectedStudents([]) // Clear selection
    } catch (err: any) {
      toast.dismiss(loadingToast)
      console.error('Error deleting multiple students:', err)
      toast.error('Öğrenciler silinirken bir hata oluştu')
    }
  }
  
  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId))
    } else {
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  // Toggle select all students
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedDepartment('')
    setActiveFilter(null)
    setShowFilters(false)
    setSortField('created_at')
    setSortDirection('desc')
  }

  // Export filtered students to CSV
  const exportToCSV = () => {
    // Use BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF'
    
    const headers = ['Ad', 'Soyad', 'Telefon', 'Bölüm', 'Durum', 'Kayıt Tarihi']
    const csvData = filteredStudents.map(student => [
      student.name,
      student.surname,
      student.phone,
      student.department?.name || '',
      student.active ? 'Aktif' : 'Pasif',
      new Date(student.created_at).toLocaleDateString('tr-TR')
    ])

    const csvContent = BOM + [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ogrenciler_${new Date().toLocaleDateString('tr-TR')}.csv`
    link.click()
    
    toast.success(`${filteredStudents.length} öğrenci CSV olarak dışa aktarıldı`)
  }

  // Toggle sort order
  const toggleSort = (field: 'name' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Generate student initials
  const getStudentInitials = (name: string, surname: string) => {
    return `${name.charAt(0).toUpperCase()}${surname.charAt(0).toUpperCase()}`
  }

  // Generate random pastel color for student avatar
  const getAvatarColor = (studentId: string) => {
    const hash = studentId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    const hue = Math.abs(hash) % 360
    return `hsla(${hue}, 85%, 90%, 1)`
  }

  // Generate darker text color from background
  const getTextColor = (studentId: string) => {
    const hash = studentId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    const hue = Math.abs(hash) % 360
    return `hsla(${hue}, 85%, 35%, 1)`
  }

  // Render loading skeletons
  const renderLoadingSkeleton = () => (
    Array(5).fill(0).map((_, idx) => (
      <tr key={`list-skeleton-${idx}`} className="animate-pulse">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
        <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-200 rounded-full"></div></td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
            <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
          </div>
        </td>
      </tr>
    ))
  )

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        {searchTerm || selectedDepartment || activeFilter !== null ? (
          <Search className="w-10 h-10 text-slate-400" />
        ) : (
          <UserX className="w-10 h-10 text-slate-400" />
        )}
      </div>
      <h3 className="text-xl font-semibold text-slate-700 mb-2">
        {searchTerm || selectedDepartment || activeFilter !== null
          ? 'Sonuç Bulunamadı'
          : 'Henüz Öğrenci Yok'}
      </h3>
      <p className="text-slate-500 mb-6 text-center max-w-sm">
        {searchTerm || selectedDepartment || activeFilter !== null
          ? 'Arama kriterlerinize uygun sonuç bulunamadı. Lütfen filtreleri değiştirin veya sıfırlayın.'
          : 'Henüz sisteme öğrenci eklenmemiş. Yeni öğrenci eklemek için aşağıdaki butonu kullanabilirsiniz.'}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        {(searchTerm || selectedDepartment || activeFilter !== null) && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Filtreleri Sıfırla</span>
          </button>
        )}
        <button
          onClick={() => router.push('/panel/ogrenciler/ekle')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yeni Öğrenci Ekle</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-slate-50/70 min-h-screen pb-12">
      {/* Header section */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Öğrenciler</h1>
              <p className="text-slate-500">
                Öğrenci kayıt ve bilgi yönetimi
              </p>
            </div>
            
            <div className="flex items-center gap-3 self-stretch sm:self-auto">
              {/* If students are selected, show bulk actions */}
              {selectedStudents.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                    {selectedStudents.length} öğrenci seçildi
                  </span>
                  
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                      <span className="font-medium text-sm text-slate-700">İşlemler</span>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </Menu.Button>
                    
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 focus:outline-none z-20">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                                } w-full text-left px-4 py-2 text-sm flex items-center gap-2`}
                                onClick={() => handleBulkStatusChange(true)}
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Aktif Yap</span>
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                                } w-full text-left px-4 py-2 text-sm flex items-center gap-2`}
                                onClick={() => handleBulkStatusChange(false)}
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Pasif Yap</span>
                              </button>
                            )}
                          </Menu.Item>
                          <div className="border-t border-slate-200 my-1"></div>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? 'bg-red-50 text-red-700' : 'text-red-600'
                                } w-full text-left px-4 py-2 text-sm flex items-center gap-2`}
                                onClick={handleBulkDelete}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Sil</span>
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                  
                  <button
                    onClick={() => setSelectedStudents([])}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Seçimi İptal Et"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={exportToCSV}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-medium text-sm">Dışa Aktar</span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/panel/ogrenciler/ekle')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="font-medium text-sm">Yeni Öğrenci</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Toplam Öğrenci</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                  {loading ? 
                    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div> :
                    studentStats.total
                  }
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <GraduationCap className="w-7 h-7 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-xs font-medium text-slate-600">100%</span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Aktif Öğrenci</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                  {loading ? 
                    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div> :
                    studentStats.active
                  }
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ 
                    width: `${studentStats.total ? (studentStats.active / studentStats.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-600">
                {studentStats.total ? Math.round((studentStats.active / studentStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pasif Öğrenci</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                  {loading ? 
                    <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div> :
                    studentStats.inactive
                  }
                </h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <XCircle className="w-7 h-7 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ 
                    width: `${studentStats.total ? (studentStats.inactive / studentStats.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-600">
                {studentStats.total ? Math.round((studentStats.inactive / studentStats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search field */}
              <div className="flex-1 min-w-[220px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ad, soyad veya telefon ile ara..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filter toggle button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                  showFilters || selectedDepartment || activeFilter !== null
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="font-medium text-sm">Filtrele</span>
                {(selectedDepartment || activeFilter !== null) && (
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </button>
              
              {/* Reset filters button */}
              {(showFilters || searchTerm || selectedDepartment || activeFilter !== null) && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="font-medium text-sm">Sıfırla</span>
                </button>
              )}
              
              {/* View mode toggle */}
              <div className="ml-auto hidden sm:flex items-center p-1 bg-slate-100 rounded-lg">
                <button 
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setViewMode('list')}
                  title="Liste görünümü"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button 
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setViewMode('grid')}
                  title="Kart görünümü"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              
              {/* Export button (mobile) */}
              <button
                onClick={exportToCSV}
                className="sm:hidden flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">CSV</span>
              </button>
            </div>

            {/* Advanced filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bölüm
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="">Tüm Bölümler</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Durum
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveFilter(activeFilter === true ? null : true)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                        activeFilter === true
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Aktif</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveFilter(activeFilter === false ? null : false)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                        activeFilter === false
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Pasif</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Sıralama
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSort('name')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg transition-colors ${
                        sortField === 'name'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm font-medium">İsim {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                    </button>
                    
                    <button
                      onClick={() => toggleSort('created_at')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg transition-colors ${
                        sortField === 'created_at'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm font-medium">Tarih {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student list (main content) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Bir hata oluştu</h3>
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={fetchStudents}
                className="mt-2 text-sm font-medium flex items-center gap-1.5 text-red-700 hover:text-red-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yeniden Yükle</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid view
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${loading ? 'opacity-60' : ''}`}>
            {loading ? (
              // Grid loading skeletons
              Array(8).fill(0).map((_, idx) => (
                <div key={`grid-skeleton-${Date.now()}-${idx}`} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-slate-200 rounded"></div>
                    <div className="h-3 bg-slate-200 rounded"></div>
                    <div className="h-6 bg-slate-200 rounded-full w-1/3 mt-4"></div>
                  </div>
                </div>
              ))
            ) : filteredStudents.length === 0 ? (
              // Empty state
              <div className="col-span-full">
                {renderEmptyState()}
              </div>
            ) : (
              // Grid of student cards
              filteredStudents.map((student) => {
                const isProcessing = processingIds[student.id]
                const isSelected = selectedStudents.includes(student.id)
                const avatarBgColor = getAvatarColor(student.id)
                const textColor = getTextColor(student.id)
                
                return (
                  <div 
                    key={student.id}
                    className={`bg-white rounded-xl border transition-all relative ${
                      isSelected 
                        ? 'border-blue-400 ring-2 ring-blue-100' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Selection checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Card content */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="w-12 h-12 flex items-center justify-center rounded-full text-lg font-bold"
                          style={{ backgroundColor: avatarBgColor, color: textColor }}
                        >
                          {getStudentInitials(student.name, student.surname)}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">
                            {student.name} {student.surname}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {student.department?.name || 'Bölüm Yok'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{student.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>Kayıt: {new Date(student.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleStatusChange(student.id, !student.active)}
                          disabled={isProcessing}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            student.active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : student.active ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{student.active ? 'Aktif' : 'Pasif'}</span>
                        </button>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/panel/ogrenciler/duzenle/${student.id}`)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Düzenle"
                            disabled={isProcessing}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Sil"
                            disabled={isProcessing}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          // Table view
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-6 py-3.5 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Öğrenci Bilgileri
                        </span>
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefon</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bölüm</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kayıt Tarihi</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Öğrenci ID</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    renderLoadingSkeleton()
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6">
                        {renderEmptyState()}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isProcessing = processingIds[student.id]
                      const isSelected = selectedStudents.includes(student.id)
                      const avatarBgColor = getAvatarColor(student.id)
                      const textColor = getTextColor(student.id)
                      
                      return (
                        <tr 
                          key={student.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleStudentSelection(student.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div 
                                className="w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                                style={{ backgroundColor: avatarBgColor, color: textColor }}
                              >
                                {getStudentInitials(student.name, student.surname)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800">
                                  {student.name} {student.surname}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <span>{student.phone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <GraduationCap className="w-4 h-4 text-slate-400" />
                              <span>{student.department?.name || 'Belirtilmemiş'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span>{new Date(student.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleStatusChange(student.id, !student.active)}
                              disabled={isProcessing}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                student.active
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : student.active ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              <span>{student.active ? 'Aktif' : 'Pasif'}</span>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <div className="text-xs bg-gray-100 text-gray-800 font-mono px-2 py-1 rounded inline-block">
                                {student.student_code || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => router.push(`/panel/ogrenciler/${student.id}`)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Görüntüle"
                                disabled={isProcessing}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => router.push(`/panel/ogrenciler/duzenle/${student.id}`)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Düzenle"
                                disabled={isProcessing}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Sil"
                                disabled={isProcessing}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Results info footer */}
      {!loading && filteredStudents.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600">
            <div>
              {searchTerm || selectedDepartment || activeFilter !== null ? (
                <span>
                  <span className="font-medium">{filteredStudents.length}</span> sonuç bulundu
                  {filteredStudents.length !== students.length && (
                    <span> (toplam {students.length} öğrenci içinde)</span>
                  )}
                </span>
              ) : (
                <span>
                  Toplam <span className="font-medium">{students.length}</span> öğrenci gösteriliyor
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-slate-900"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV olarak dışa aktar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}