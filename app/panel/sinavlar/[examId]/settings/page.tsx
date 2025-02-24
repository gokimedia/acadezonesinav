'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { FormInput } from '@/components/common/FormInput';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

interface ExamStudent {
  id?: string;
  name: string;
  surname: string;
  phone: string;
  student_code?: string;
  created_at?: string;
}

function StudentForm({ onSave }: { onSave: (student: ExamStudent) => void }) {
  const [formData, setFormData] = useState<ExamStudent>({
    name: '',
    surname: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.surname.trim() || !formData.phone.trim()) {
      alert('Ad, soyad ve telefon alanları zorunludur!');
      return;
    }

    // Telefon numarası formatı kontrolü
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
      alert('Lütfen geçerli bir telefon numarası girin (10 haneli)');
      return;
    }

    onSave(formData);

    // Formu temizle
    setFormData({
      name: '',
      surname: '',
      phone: '',
    });
  };

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Ad"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FormInput
            label="Soyad"
            value={formData.surname}
            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            required
          />
          <FormInput
            label="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="5XX XXX XX XX"
            type="tel"
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Öğrenci Ekle</Button>
        </div>
      </form>
    </Card>
  );
}

function StudentTable({ students, onDelete, onEdit }: { 
  students: ExamStudent[];
  onDelete: (id: string) => void;
  onEdit: (student: ExamStudent) => void;
}) {
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Başlık
    doc.setFontSize(16);
    doc.text('Sınav Öğrenci Listesi', 14, 15);
    doc.setFontSize(10);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);

    // Tablo
    const headers = [['Ad', 'Soyad', 'Telefon', 'Öğrenci Kodu', 'Kayıt Tarihi']];
    const data = students.map(student => [
      student.name,
      student.surname,
      student.phone,
      student.student_code || '',
      student.created_at ? new Date(student.created_at).toLocaleDateString('tr-TR') : ''
    ]);

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] }
    });

    doc.save('ogrenci-listesi.pdf');
  };

  return (
    <Card>
      <div className="mb-4 flex justify-end">
        <Button onClick={exportToPDF}>PDF İndir</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soyad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci Kodu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kayıt Tarihi</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.surname}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{student.student_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.created_at ? new Date(student.created_at).toLocaleDateString('tr-TR') : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(student)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => onDelete(student.id!)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function ExamSettingsPage() {
  const { examId } = useParams();
  const [students, setStudents] = useState<ExamStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    console.log('Exam ID:', examId);
    loadExamStudents();
  }, [examId]);

  const loadExamStudents = async () => {
    try {
      console.log('Öğrenciler yükleniyor...');
      setLoading(true);
      setError('');

      // Önce exam_students tablosundan öğrenci ID'lerini al
      const { data, error } = await supabase
        .from('exam_students')
        .select()
        .eq('exam_id', examId);

      console.log('Exam_students sonuç:', data);
      console.log('Exam_students hata:', error);

      if (error) throw error;

      if (!data) {
        setStudents([]);
        return;
      }

      // Öğrenci detaylarını al
      const studentIds = data.map(item => item.student_id);
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select()
        .in('id', studentIds);

      console.log('Students sonuç:', studentsData);
      console.log('Students hata:', studentsError);

      if (studentsError) throw studentsError;

      // Verileri birleştir
      const combinedData = data.map(examStudent => {
        const student = studentsData?.find(s => s.id === examStudent.student_id);
        return {
          id: examStudent.id,
          name: student?.name || '',
          surname: student?.surname || '',
          phone: student?.phone || '',
          student_code: examStudent.student_code || '',
          created_at: examStudent.created_at || '',
        };
      });

      console.log('Birleştirilmiş veriler:', combinedData);
      setStudents(combinedData);
    } catch (error: any) {
      console.error('Öğrenciler yüklenirken hata:', error);
      console.error('Hata stack:', error.stack);
      setError('Öğrenciler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Benzersiz öğrenci kodu oluştur (ACA + 5 haneli sayı)
  const generateStudentCode = async (): Promise<string> => {
    while (true) {
      // 10000-99999 arası rastgele sayı
      const randomNum = Math.floor(Math.random() * 90000) + 10000;
      const studentCode = `ACA${randomNum}`;
      
      // Bu kodun daha önce kullanılıp kullanılmadığını kontrol et
      const { data, error } = await supabase
        .from('exam_students')
        .select('id')
        .eq('student_code', studentCode)
        .single();

      if (error && error.code === 'PGRST116') {
        // Kod bulunamadı, yani kullanılabilir
        return studentCode;
      }
      
      // Hata varsa veya kod zaten kullanılmışsa, yeni kod dene
      console.log('Kod zaten kullanımda, yeni kod deneniyor:', studentCode);
    }
  };

  const handleAddStudent = async (studentData: ExamStudent) => {
    try {
      console.log('Öğrenci ekleme başladı:', { studentData, examId });
      
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Benzersiz öğrenci kodu oluştur
      const studentCode = await generateStudentCode();
      console.log('Oluşturulan öğrenci kodu:', studentCode);

      // 1. Önce öğrenciyi students tablosuna ekle
      console.log('Students tablosuna ekleniyor...');
      const studentInsert = await supabase
        .from('students')
        .insert({
          name: studentData.name,
          surname: studentData.surname,
          phone: studentData.phone,
          active: true,
        })
        .select()
        .single();

      console.log('Students insert sonuç:', studentInsert);

      if (studentInsert.error) {
        console.error('Students insert hatası:', {
          error: studentInsert.error,
          details: studentInsert.error.details,
          hint: studentInsert.error.hint,
          message: studentInsert.error.message
        });
        throw studentInsert.error;
      }

      if (!studentInsert.data) {
        throw new Error('Öğrenci eklenemedi: Veri dönmedi');
      }

      const studentResult = studentInsert.data;

      // 2. Sonra exam_students tablosuna ekle
      console.log('Exam_students tablosuna ekleniyor...', {
        exam_id: examId,
        student_id: studentResult.id,
        student_code: studentCode
      });

      const examStudentInsert = await supabase
        .from('exam_students')
        .insert({
          exam_id: examId,
          student_id: studentResult.id,
          student_code: studentCode
        })
        .select()
        .single();

      console.log('Exam_students insert sonuç:', examStudentInsert);

      if (examStudentInsert.error) {
        // Rollback: Eklenen öğrenciyi sil
        console.log('Exam_students hatası, rollback yapılıyor...', {
          error: examStudentInsert.error,
          details: examStudentInsert.error.details,
          hint: examStudentInsert.error.hint,
          message: examStudentInsert.error.message
        });

        const rollback = await supabase
          .from('students')
          .delete()
          .eq('id', studentResult.id);

        console.log('Rollback sonucu:', rollback);
        
        throw examStudentInsert.error;
      }

      if (!examStudentInsert.data) {
        throw new Error('Exam_students eklenemedi: Veri dönmedi');
      }

      const examStudentResult = examStudentInsert.data;

      // 3. Yeni öğrenciyi state'e ekle
      const newStudent: ExamStudent = {
        id: examStudentResult.id,
        name: studentResult.name,
        surname: studentResult.surname,
        phone: studentResult.phone,
        student_code: studentCode,
        created_at: examStudentResult.created_at,
      };

      console.log('Yeni öğrenci oluşturuldu:', newStudent);
      setStudents(prevStudents => [...prevStudents, newStudent]);
      toast.success('Öğrenci başarıyla eklendi!');
    } catch (err: any) {
      console.error('Öğrenci eklenirken hata:', {
        error: err,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        name: err?.name,
        code: err?.code
      });
      toast.error(err?.message || 'Öğrenci eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      console.log('Öğrenci silme başladı:', id);
      
      setLoading(true);
      setError('');

      const { error } = await supabase
        .from('exam_students')
        .delete()
        .eq('id', id);

      console.log('Exam_students silme sonucu:', error);

      if (error) throw error;

      setStudents(students.filter(s => s.id !== id));
      toast.success('Öğrenci başarıyla silindi');
    } catch (error: any) {
      console.error('Öğrenci silinirken hata:', error);
      console.error('Hata stack:', error.stack);
      toast.error('Öğrenci silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (student: ExamStudent) => {
    try {
      console.log('Öğrenci güncelleme başladı:', student);
      
      setLoading(true);

      // Öğrenci bilgilerini güncelle
      const { error: updateError } = await supabase
        .from('students')
        .update({
          name: student.name,
          surname: student.surname,
          phone: student.phone,
        })
        .eq('id', student.id);

      console.log('Students güncelleme sonucu:', updateError);

      if (updateError) throw updateError;

      // Öğrenci listesini güncelle
      setStudents(students.map(s => 
        s.id === student.id ? student : s
      ));

      toast.success('Öğrenci bilgileri güncellendi');
    } catch (error) {
      console.error('Öğrenci güncellenirken hata:', error);
      console.error('Hata stack:', error.stack);
      toast.error('Öğrenci güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Sınav Ayarları</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Öğrenci Ekle</h2>
        <StudentForm onSave={handleAddStudent} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Sınav Öğrencileri</h2>
        <StudentTable 
          students={students} 
          onDelete={handleDeleteStudent}
          onEdit={handleEditStudent}
        />
      </div>
    </div>
  );
}
