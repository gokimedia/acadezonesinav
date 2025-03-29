'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus,
  Trash2,
  Edit2,
  GraduationCap,
  Search,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  name: string;
  created_at: string;
  student_count?: number;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [savingDepartment, setSavingDepartment] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      
      // Önce bölümleri al
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (departmentsError) throw departmentsError;

      // Her bölüm için öğrenci sayısını al
      const departmentsWithCounts = await Promise.all(
        (departmentsData || []).map(async (dept) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);

          return {
            ...dept,
            student_count: count || 0
          };
        })
      );

      setDepartments(departmentsWithCounts);
    } catch (err: any) {
      console.error('Bölümler yüklenirken hata:', err);
      toast.error('Bölümler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({ name: department.name });
    } else {
      setEditingDepartment(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    setFormData({ name: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Lütfen bölüm adını giriniz');
      return;
    }
    
    setSavingDepartment(true);
    
    try {
      if (editingDepartment) {
        // Güncelleme
        const { error } = await supabase
          .from('departments')
          .update({ name: formData.name.trim() })
          .eq('id', editingDepartment.id);

        if (error) throw error;
        toast.success('Bölüm güncellendi');
      } else {
        // Yeni ekleme
        const { error } = await supabase
          .from('departments')
          .insert({ name: formData.name.trim() });

        if (error) throw error;
        toast.success('Bölüm eklendi');
      }

      handleCloseModal();
      fetchDepartments();
    } catch (err: any) {
      console.error('Bölüm kaydedilirken hata:', err);
      toast.error('Bölüm kaydedilirken bir hata oluştu');
    } finally {
      setSavingDepartment(false);
    }
  };

  const handleDelete = async (department: Department) => {
    if (!window.confirm(`"${department.name}" bölümünü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      // Önce bu bölümdeki öğrenci sayısını kontrol et
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', department.id);

      if (count && count > 0) {
        toast.error('Bu bölümde kayıtlı öğrenciler var. Önce öğrencileri başka bir bölüme aktarın veya silin.');
        return;
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', department.id);

      if (error) throw error;

      toast.success('Bölüm silindi');
      fetchDepartments();
    } catch (err: any) {
      console.error('Bölüm silinirken hata:', err);
      toast.error('Bölüm silinirken bir hata oluştu');
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Üst Kısım */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Bölümler</h1>
            <p className="text-slate-500 mt-1">
              Toplam {filteredDepartments.length} bölüm listeleniyor
            </p>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Bölüm</span>
          </button>
        </div>
      </div>

      {/* Arama */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Bölüm adı ile ara..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Bölüm Listesi */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Bölüm Adı</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Öğrenci Sayısı</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Oluşturulma Tarihi</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <GraduationCap className="w-12 h-12 text-slate-300 mb-2" />
                      <h3 className="text-lg font-medium text-slate-700 mb-1">Bölüm Bulunamadı</h3>
                      <p className="text-slate-500 mb-4">
                        {searchTerm
                          ? 'Arama kriterlerinize uygun bölüm bulunamadı.'
                          : 'Henüz hiç bölüm eklenmemiş.'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => handleOpenModal()}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Yeni Bölüm Ekle</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((department) => (
                  <tr key={department.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-800">
                          {department.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {department.student_count} Öğrenci
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(department.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(department)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(department)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">
                {editingDepartment ? 'Bölüm Düzenle' : 'Yeni Bölüm'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-500 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Bölüm Adı
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    placeholder="Bölüm adını girin"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={savingDepartment}
                    className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                      savingDepartment ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingDepartment ? 'Kaydediliyor...' : 'Kaydet'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
