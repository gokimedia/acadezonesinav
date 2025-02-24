'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { supabase } from '@/lib/supabase';

interface Department {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  active?: boolean;  // tabloya eklediyseniz
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ekleme formu
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  // Düzenleme (edit) formu
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDepartments(data || []);
    } catch (err: any) {
      console.error('Bölümler yüklenirken hata:', err);
      setError('Bölümler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) {
      setError('Bölüm adı boş olamaz');
      return;
    }
    setError(null);

    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([
          {
            name: newDepartmentName.trim(),
            active: true, // varsayılan aktif eklenebilir
          },
        ])
        .select()
        .single(); // tek satır dönmesini bekliyoruz

      if (error) throw error;

      // Yeni bölüm, var olan listeye ekleniyor
      setDepartments([data, ...departments]);
      // Form temizle
      setNewDepartmentName('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Bölüm eklenirken hata:', err.message || err);
      setError('Bölüm eklenirken beklenmeyen bir hata oluştu');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Bu bölümü silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Silinen departmanı listeden çıkar
      setDepartments((prev) => prev.filter((dept) => dept.id !== id));
    } catch (err: any) {
      console.error('Bölüm silinirken hata:', err);
      setError('Bölüm silinirken bir hata oluştu');
    }
  };

  const startEditDepartment = (department: Department) => {
    setEditId(department.id);
    setEditName(department.name);
    setEditActive(department.active ?? true);
  };

  const handleUpdateDepartment = async () => {
    if (!editId || !editName.trim()) {
      setError('Bölüm adı boş olamaz');
      return;
    }
    setError(null);

    try {
      const { data, error } = await supabase
        .from('departments')
        .update({
          name: editName.trim(),
          active: editActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editId)
        .select()
        .single();

      if (error) throw error;

      // Güncellenen departmanı state’de güncelle
      setDepartments((prev) =>
        prev.map((dept) => (dept.id === editId ? data : dept))
      );

      // Formu kapat
      setEditId(null);
      setEditName('');
      setEditActive(true);
    } catch (err: any) {
      console.error('Bölüm güncellenirken hata:', err);
      setError('Bölüm güncellenirken beklenmeyen bir hata oluştu');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bölümler</h1>
        <Button onClick={() => setShowAddForm(true)}>Yeni Bölüm Ekle</Button>
      </div>

      {/* Hata bildirimi */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Bölüm Ekle Formu */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Yeni Bölüm Ekle</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="Bölüm Adı"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleAddDepartment}>Ekle</Button>
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
              İptal
            </Button>
          </div>
        </div>
      )}

      {/* Düzenleme Formu */}
      {editId && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Bölüm Düzenle</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Bölüm Adı"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <label htmlFor="active-toggle" className="text-sm font-medium">
                Aktif mi?
              </label>
              <input
                id="active-toggle"
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="w-5 h-5"
              />
            </div>
            <Button onClick={handleUpdateDepartment}>Kaydet</Button>
            <Button variant="ghost" onClick={() => setEditId(null)}>
              İptal
            </Button>
          </div>
        </div>
      )}

      {/* Bölümler Tablosu */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bölüm Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oluşturulma Tarihi
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map((department) => (
              <tr key={department.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {department.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {department.active ? (
                    <span className="text-green-600">Aktif</span>
                  ) : (
                    <span className="text-red-600">Pasif</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(department.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEditDepartment(department)}
                  >
                    Düzenle
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-900"
                    onClick={() => handleDeleteDepartment(department.id)}
                  >
                    Sil
                  </Button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Henüz bölüm eklenmemiş
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
