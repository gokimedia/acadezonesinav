'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface ExamStudent {
  id: string;
  exam_id: string;
  student_id: string;
  student: Student;
}

export default function ExamStudentsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const [examStudents, setExamStudents] = useState<ExamStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchExamStudents();
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('first_name');

      if (error) {
        console.error('Öğrenciler yüklenirken hata:', error.message);
        throw error;
      }

      setStudents(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu';
      console.error('Öğrenciler yüklenirken hata:', errorMessage);
    }
  };

  async function fetchExamStudents() {
    try {
      // Önce sınavı kontrol edelim
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select()
        .eq('id', examId)
        .single();

      if (examError) {
        console.error('Sınav bilgisi alınırken hata:', examError.message);
        throw new Error('Sınav bilgisi alınamadı: ' + examError.message);
      }

      if (!exam) {
        throw new Error('Sınav bulunamadı');
      }

      // Öğrenci listesini ve detaylarını tek sorguda alalım
      const { data: examStudentsData, error: examStudentsError } = await supabase
        .from('exam_students')
        .select(`
          id,
          student_id,
          students (
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('exam_id', examId);

      if (examStudentsError) {
        console.error('Sınav öğrencileri alınırken hata:', examStudentsError.message);
        throw new Error('Sınav öğrencileri alınamadı: ' + examStudentsError.message);
      }

      // Verileri formatlayalım
      const formattedData = examStudentsData
        .filter(es => es.students) // null students'ları filtrele
        .map(es => ({
          id: es.id,
          exam_id: examId,
          student_id: es.student_id,
          student: es.students
        }));

      setExamStudents(formattedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu';
      console.error('Öğrenciler yüklenirken hata:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleAddStudent = async () => {
    if (!selectedStudent) {
      setError('Lütfen bir öğrenci seçin');
      return;
    }

    try {
      // Önce bu öğrencinin sınava zaten ekli olup olmadığını kontrol edelim
      const { data: existingStudent, error: checkError } = await supabase
        .from('exam_students')
        .select()
        .eq('exam_id', examId)
        .eq('student_id', selectedStudent)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingStudent) {
        setError('Bu öğrenci zaten sınava ekli');
        return;
      }

      // Öğrenciyi sınava ekleyelim
      const { data, error } = await supabase
        .from('exam_students')
        .insert([{
          exam_id: examId,
          student_id: selectedStudent
        }])
        .select(`
          id,
          student_id,
          students (
            id,
            first_name,
            last_name,
            phone
          )
        `)
        .single();

      if (error) {
        console.error('Öğrenci eklenirken hata:', error.message);
        throw error;
      }

      if (data) {
        const newExamStudent = {
          id: data.id,
          exam_id: examId,
          student_id: data.student_id,
          student: data.students
        };
        setExamStudents([...examStudents, newExamStudent]);
        setSelectedStudent('');
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu';
      console.error('Öğrenci eklenirken hata:', errorMessage);
      setError('Öğrenci eklenirken bir hata oluştu');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('exam_students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      setExamStudents(examStudents.filter(es => es.id !== studentId));
    } catch (err) {
      console.error('Öğrenci çıkarılırken hata:', err);
      alert('Öğrenci çıkarılırken bir hata oluştu');
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // PDF başlığı
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Sınav Öğrenci Listesi', 20, 20);
    
    // Alt başlık ve tarih
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);
    
    // Tablo başlıkları
    doc.setFont('helvetica', 'bold');
    doc.text('ID', 20, 45);
    doc.text('Ad Soyad', 70, 45);
    
    // Öğrenci listesi
    doc.setFont('helvetica', 'normal');
    examStudents.forEach((examStudent, index) => {
      const y = 55 + (index * 10);
      if (y > 270) { // Sayfa sınırına yaklaşıldığında yeni sayfa
        doc.addPage();
        doc.setFont('helvetica', 'bold');
        doc.text('ID', 20, 20);
        doc.text('Ad Soyad', 70, 20);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(examStudent.student.id, 20, y);
      doc.text(
        `${examStudent.student.first_name} ${examStudent.student.last_name}`,
        70,
        y
      );
    });
    
    doc.save('sinav-ogrenci-listesi.pdf');
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{error}</h2>
        <Button
          variant="primary"
          onClick={() => router.push('/panel/sinavlar')}
        >
          Sınavlara Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sınav Öğrencileri</h1>
        <Button onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-2" />
          PDF İndir
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card>
        <div className="mb-4">
          <div className="flex gap-2">
            <select
              className="flex-1 p-2 border rounded"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Öğrenci Seçin</option>
              {students
                .filter(student => !examStudents.some(es => es.student_id === student.id))
                .map(student => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name}
                  </option>
                ))}
            </select>
            <Button onClick={handleAddStudent} disabled={!selectedStudent}>
              Öğrenci Ekle
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Soyad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {examStudents.map((examStudent) => (
                <tr key={examStudent.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {examStudent.student.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {examStudent.student.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {examStudent.student.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {examStudent.student.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm('Bu öğrenciyi sınavdan çıkarmak istediğinize emin misiniz?')) {
                          handleRemoveStudent(examStudent.id);
                        }
                      }}
                    >
                      Çıkar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
