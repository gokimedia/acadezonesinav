'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Department {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function DepartmentDetail({ params }: { params: { bolumId: string } }) {
  const router = useRouter();
  const [department, setDepartment] = useState<Department | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchDepartmentData();
  }, []);

  const fetchDepartmentData = async () => {
    try {
      // Fetch department details
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', params.bolumId)
        .single();

      if (deptError) throw deptError;

      // Fetch department's exams
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('department_id', params.bolumId)
        .order('created_at', { ascending: false });

      if (examError) throw examError;

      setDepartment(deptData);
      setExams(examData || []);
    } catch (error) {
      console.error('Error fetching department data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!department) return;

    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: department.name,
          description: department.description
        })
        .eq('id', params.bolumId);

      if (error) throw error;
      setEditing(false);
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu bölümü silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', params.bolumId);

      if (error) throw error;
      router.push('/panel/bolumler');
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (!department) return <div>Bölüm bulunamadı</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bölüm Detayları</h1>
        <div className="space-x-2">
          <button
            onClick={() => setEditing(!editing)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {editing ? 'İptal' : 'Düzenle'}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sil
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Bölüm Adı</label>
              <input
                type="text"
                value={department.name}
                onChange={(e) => setDepartment({ ...department, name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Açıklama</label>
              <textarea
                value={department.description}
                onChange={(e) => setDepartment({ ...department, description: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              onClick={handleUpdate}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Kaydet
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-2">{department.name}</h2>
            <p className="text-gray-600">{department.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              Oluşturulma: {new Date(department.created_at).toLocaleDateString('tr-TR')}
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sınavlar</h2>
          <Link
            href={`/panel/sinavlar/create?department=${params.bolumId}`}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Yeni Sınav
          </Link>
        </div>

        <div className="grid gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{exam.title}</h3>
                  <p className="text-sm text-gray-600">{exam.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  exam.status === 'active' ? 'bg-green-100 text-green-800' :
                  exam.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {exam.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <div>Başlangıç: {new Date(exam.start_time).toLocaleString('tr-TR')}</div>
                <div>Bitiş: {new Date(exam.end_time).toLocaleString('tr-TR')}</div>
              </div>
              <div className="mt-3 space-x-2">
                <Link
                  href={`/panel/sinavlar/${exam.id}/edit`}
                  className="text-blue-500 hover:underline"
                >
                  Düzenle
                </Link>
                <Link
                  href={`/panel/sinavlar/${exam.id}/ogrenciler`}
                  className="text-purple-500 hover:underline"
                >
                  Öğrenciler
                </Link>
                <Link
                  href={`/panel/canli-sonuclar/${exam.id}`}
                  className="text-green-500 hover:underline"
                >
                  Sonuçlar
                </Link>
              </div>
            </div>
          ))}
          
          {exams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Bu bölüme ait sınav bulunmamaktadır.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
