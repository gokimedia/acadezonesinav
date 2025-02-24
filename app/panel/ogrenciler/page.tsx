'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/common/Card';

/* ------------------ Tip Tanımları ------------------ */
interface Student {
  id: string;
  name: string;
  surname: string;
  phone?: string;
  department_name?: string;
  exam_title?: string;
  score?: number;
  correct_count?: number;
  wrong_count?: number;
}

/* ------------------ Yardımcı Bileşenler ------------------ */
function LoadingSpinner() {
  return (
    <div className="text-center py-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      <p className="mt-2">Yükleniyor...</p>
    </div>
  );
}

/* ------------------ Tablo Bileşeni ------------------ */
interface StudentTableProps {
  students: Student[];
}

function StudentTable({ students }: StudentTableProps) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ad Soyad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Telefon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Bölüm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sınav
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Puan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Doğru/Yanlış
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.name} {student.surname}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.department_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.exam_title || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.score !== undefined ? student.score : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.correct_count !== undefined && student.wrong_count !== undefined
                    ? `${student.correct_count}/${student.wrong_count}`
                    : '-'}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Kayıtlı öğrenci bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------ Sayfa Bileşeni ------------------ */
export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          surname,
          phone,
          departments (
            name
          ),
          exam_students (
            exam_id,
            exams (
              title
            ),
            results (
              score,
              correct_count,
              wrong_count
            )
          )
        `);

      if (error) throw error;

      // Veriyi düzenle
      const formattedData = data?.map(student => ({
        id: student.id,
        name: student.name,
        surname: student.surname,
        phone: student.phone,
        department_name: student.departments?.name,
        exam_title: student.exam_students?.[0]?.exams?.title,
        score: student.exam_students?.[0]?.results?.[0]?.score,
        correct_count: student.exam_students?.[0]?.results?.[0]?.correct_count,
        wrong_count: student.exam_students?.[0]?.results?.[0]?.wrong_count,
      })) || [];

      setStudents(formattedData);
    } catch (err) {
      console.error('Öğrenciler yüklenirken hata:', err);
      setError('Öğrenciler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-6 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Öğrenci Listesi</h1>
      </div>

      <StudentTable students={students} />
    </div>
  );
}
