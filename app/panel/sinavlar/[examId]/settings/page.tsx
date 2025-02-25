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
import { PlusCircle, Download, Edit2, Trash2, Search, Users, BookOpen } from 'lucide-react';

interface ExamStudent {
  id?: string;        // exam_students tablosundaki id
  student_id?: string; // students tablosundaki id
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
      toast.error('Ad, soyad ve telefon alanları zorunludur!');
      return;
    }

    // Telefon numarası formatı kontrolü
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
      toast.error('Lütfen geçerli bir telefon numarası girin (10 haneli)');
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
    <Card className="mb-6 p-6 shadow-md border-0 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormInput
            label="Ad"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <FormInput
            label="Soyad"
            value={formData.surname}
            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
            required
            className="rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <FormInput
            label="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="5XX XXX XX XX"
            type="tel"
            required
            className="rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-200 flex items-center gap-2"
          >
            <PlusCircle size={18} /> Öğrenci Ekle
          </Button>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState(students);

  useEffect(() => {
    const results = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm)
    );
    setFilteredStudents(results);
  }, [searchTerm, students]);

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
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('ogrenci-listesi.pdf');
  };

  return (
    <Card className="shadow-md border-0 rounded-lg p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Öğrenci ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={exportToPDF}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-md transition duration-200 flex items-center justify-center gap-2"
        >
          <Download size={18} /> PDF İndir
        </Button>
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ad</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Soyad</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Telefon</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Öğrenci Kodu</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kayıt Tarihi</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
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
                      className="text-blue-600 hover:text-blue-900 mr-4 transition-colors flex items-center gap-1 inline-flex"
                    >
                      <Edit2 size={16} /> Düzenle
                    </button>
                    <button
                      onClick={() => onDelete(student.id!)}
                      className="text-red-600 hover:text-red-900 transition-colors flex items-center gap-1 inline-flex"
                    >
                      <Trash2 size={16} /> Sil
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  {searchTerm ? "Aranan kriterlere uygun öğrenci bulunamadı." : "Henüz öğrenci eklenmemiş."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {students.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Toplam {students.length} öğrenci
        </div>
      )}
    </Card>
  );
}

export default function ExamSettingsPage() {
  const { examId } = useParams();
  const [students, setStudents] = useState<ExamStudent[]>([]);
  const [examInfo, setExamInfo] = useState<{ title: string; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [editingStudent, setEditingStudent] = useState<ExamStudent | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    surname: '',
    phone: ''
  });

  useEffect(() => {
    loadExamInfo();
    loadExamStudents();
  }, [examId]);

  const loadExamInfo = async () => {
    try {
      if (!examId) {
        console.log('Sınav ID\'si bulunamadı, bilgiler yüklenemedi');
        return;
      }
      
      console.log('Sınav bilgileri yükleniyor...', examId);
      
      const { data, error } = await supabase
        .from('exams')
        .select('title, start_date')
        .eq('id', examId)
        .single();

      if (error) {
        console.error('Supabase hatası:', { 
          code: error.code, 
          message: error.message, 
          details: error.details 
        });
        throw error;
      }

      if (data) {
        console.log('Sınav bilgileri başarıyla yüklendi:', data);
        try {
          // Tarih formatını güvenli bir şekilde işle
          const examDate = data.start_date ? new Date(data.start_date) : new Date();
          const formattedDate = examDate instanceof Date && !isNaN(examDate.getTime()) 
            ? examDate.toLocaleDateString('tr-TR') 
            : 'Tarih bilgisi yok';
            
          setExamInfo({
            title: data.title || 'İsimsiz Sınav',
            date: formattedDate
          });
        } catch (dateError) {
          console.error('Tarih formatlanırken hata:', dateError);
          setExamInfo({
            title: data.title || 'İsimsiz Sınav',
            date: 'Tarih işlenirken hata oluştu'
          });
        }
      } else {
        console.log('Sınav bilgisi bulunamadı');
        setExamInfo({ title: 'Sınav Bulunamadı', date: '' });
      }
    } catch (error: any) {
      console.error('Sınav bilgileri yüklenirken hata:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack
      });
      // Varsayılan bir değer ayarla
      setExamInfo({ title: 'Sınav Bilgileri', date: '' });
    }
  };

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
          student_id: examStudent.student_id, // Öğrenci tablosundaki ID'yi saklıyoruz
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
    if (!student.student_id) {
      toast.error('Öğrenci ID bilgisi bulunamadı');
      return;
    }
    
    // Düzenleme formunu doldur
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      surname: student.surname,
      phone: student.phone
    });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditFormData({
      name: '',
      surname: '',
      phone: ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingStudent || !editingStudent.student_id) {
        toast.error('Öğrenci bilgileri eksik');
        return;
      }

      // Form validasyonu
      if (!editFormData.name.trim() || !editFormData.surname.trim() || !editFormData.phone.trim()) {
        toast.error('Ad, soyad ve telefon alanları zorunludur!');
        return;
      }

      // Telefon numarası kontrolü
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(editFormData.phone.replace(/[^0-9]/g, ''))) {
        toast.error('Lütfen geçerli bir telefon numarası girin (10 haneli)');
        return;
      }

      console.log('Öğrenci güncelleme başladı:', editingStudent);
      
      setLoading(true);

      // Öğrenci bilgilerini güncelle
      const { error: updateError } = await supabase
        .from('students')
        .update({
          name: editFormData.name,
          surname: editFormData.surname,
          phone: editFormData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingStudent.student_id);

      console.log('Students güncelleme sonucu:', updateError);

      if (updateError) throw updateError;

      // Öğrenci listesini güncelle
      setStudents(students.map(s => 
        s.id === editingStudent.id ? {
          ...s,
          name: editFormData.name,
          surname: editFormData.surname,
          phone: editFormData.phone
        } : s
      ));

      toast.success('Öğrenci bilgileri güncellendi');
      handleCancelEdit(); // Formu kapat
    } catch (error) {
      console.error('Öğrenci güncellenirken hata:', error);
      console.error('Hata stack:', error.stack);
      toast.error('Öğrenci güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sınav Ayarları</h1>
              {examInfo && (
                <p className="mt-1 text-sm text-gray-600">
                  {examInfo.title} - {examInfo.date}
                </p>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Users size={16} className="mr-1" /> {students.length} Öğrenci
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center mb-6">
            <BookOpen size={24} className="text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Öğrenci Ekle</h2>
          </div>
          {editingStudent ? (
            <Card className="mb-6 p-6 shadow-md border-0 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Öğrenci Düzenle</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput
                    label="Ad"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    className="rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <FormInput
                    label="Soyad"
                    value={editFormData.surname}
                    onChange={(e) => setEditFormData({ ...editFormData, surname: e.target.value })}
                    required
                    className="rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <FormInput
                    label="Telefon"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="5XX XXX XX XX"
                    type="tel"
                    required
                    className="rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    onClick={handleSaveEdit}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition duration-200 flex items-center gap-2"
                  >
                    Kaydet
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition duration-200 flex items-center gap-2"
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <StudentForm onSave={handleAddStudent} />
          )}
        </div>

        <div>
          <div className="flex items-center mb-6">
            <Users size={24} className="text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Sınav Öğrencileri</h2>
          </div>
          <StudentTable 
            students={students} 
            onDelete={handleDeleteStudent}
            onEdit={handleEditStudent}
          />
        </div>
      </div>
    </div>
  );
}