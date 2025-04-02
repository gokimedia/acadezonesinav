'use client';

import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Save, Trash2, Edit2, CheckCircle, XCircle, X, AlertTriangle, 
  Calendar, Clock, AlignLeft, HelpCircle, List, GripVertical,
  FileText, CheckSquare, Type, PlusCircle, Loader2, Settings,
  ChevronDown, AlertCircle, GraduationCap, MoveVertical, Eye,
  Award, MessageSquare, BarChart, Users, UserPlus, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Type definitions
interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill';
  options: string[];
  correct_answer: string | boolean;
  points: number;
  exam_id?: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  passing_grade?: number;
  department_id?: string;
  department?: {
    name: string;
  };
}

interface Student {
  id: string;
  name: string;
  surname: string;
  student_code: string;
  department_id: string;
  department?: { name: string };
}

// Tür tanımlarını düzeltelim
interface FetchedDepartment {
  name: string;
}

interface FetchedStudent {
  id: string;
  name: string;
  surname: string;
  student_code: string | null;
  department_id: string;
  departments?: FetchedDepartment;
  department?: FetchedDepartment;
}

// Sortable Question Item Component
function SortableQuestionItem({ 
  question, 
  index, 
  onEdit, 
  onDelete 
}: { 
  question: Question; 
  index: number; 
  onEdit: (question: Question) => void; 
  onDelete: (id: string) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-4"
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded active:cursor-grabbing"
          >
            <GripVertical className="w-5 h-5" />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-800 font-medium py-1 px-2 rounded text-xs">
              {question.question_type === 'multiple_choice' ? 'Çoktan Seçmeli' : 
               question.question_type === 'true_false' ? 'Doğru/Yanlış' : 'Boşluk Doldurma'}
            </div>
            <div className="bg-indigo-50 text-indigo-600 py-0.5 px-2 rounded-full text-xs font-medium">
              {question.points} Puan
            </div>
            <div className="text-slate-500 text-sm font-medium">
              Soru #{index + 1}
            </div>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(question)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Düzenle"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(question.id)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-base font-medium text-slate-800 mb-4">
          {question.question_text}
        </h3>
        
        <div className="space-y-2 pl-4">
          {question.question_type === 'multiple_choice' && question.options && question.options.map((option: string, optionIndex: number) => (
            <div
              key={optionIndex}
              className={`p-2.5 rounded-lg flex items-center \${
                String(option) === String(question.correct_answer)
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <div className={`w-6 h-6 flex items-center justify-center mr-2.5 rounded-full text-sm font-medium \${
                String(option) === String(question.correct_answer)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {String.fromCharCode(65 + optionIndex)}
              </div>
              <span className="flex-1">{option}</span>
              {String(option) === String(question.correct_answer) && (
                <CheckCircle className="w-4.5 h-4.5 text-green-600 ml-2" />
              )}
            </div>
          ))}
          
          {question.question_type === 'true_false' && (
            <div className="flex gap-4">
              <div 
                className={`p-3 rounded-lg flex items-center gap-2.5 \${
                  question.correct_answer === true
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Doğru</span>
                {question.correct_answer === true && (
                  <div className="ml-1.5 text-xs py-0.5 px-2 bg-green-100 text-green-800 rounded-full">
                    ✓ Doğru Cevap
                  </div>
                )}
              </div>
              
              <div 
                className={`p-3 rounded-lg flex items-center gap-2.5 \${
                  question.correct_answer === false
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <XCircle className="w-5 h-5" />
                <span>Yanlış</span>
                {question.correct_answer === false && (
                  <div className="ml-1.5 text-xs py-0.5 px-2 bg-green-100 text-green-800 rounded-full">
                    ✓ Doğru Cevap
                  </div>
                )}
              </div>
            </div>
          )}
          
          {question.question_type === 'fill' && (
            <div className="p-3.5 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center">
              <span className="font-medium mr-2.5">Doğru Cevap:</span>
              <span className="bg-white px-3 py-1.5 rounded border border-green-200 font-medium">
                {question.correct_answer}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  
  // Main state
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'details' | 'questions' | 'students'>('details');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  });
  
  // DnD setup for question reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Derived state
  const totalPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + q.points, 0);
  }, [questions]);
  
  // New state for students
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load exam and questions
  useEffect(() => {
    async function fetchExam() {
      try {
        // First fetch the exam
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select(`*, department:departments(name)`)
          .eq('id', examId)
          .single();

        if (examError) throw examError;
        if (!examData) throw new Error('Sınav bulunamadı');

        setExam(examData);

        // Then fetch questions
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId)
          .order('id');

        if (questionError) throw questionError;
        
        // Format questions from database structure to our component structure
        const formattedQuestions: Question[] = (questionData || []).map(q => {
          // Extract options from individual fields
          const options: string[] = [];
          if (q.option_a) options.push(q.option_a);
          if (q.option_b) options.push(q.option_b);
          if (q.option_c) options.push(q.option_c);
          if (q.option_d) options.push(q.option_d);
          
          let correctAnswer = q.correct_answer;
          
          // Convert letter answer (A, B, C, D) to full option text for multiple choice questions
          if (q.question_type === 'multiple_choice' && q.correct_answer) {
            const letterCode = q.correct_answer.charCodeAt(0);
            // If it's A, B, C, D (65, 66, 67, 68)
            if (letterCode >= 65 && letterCode <= 68) {
              const optionIndex = letterCode - 65; // A=0, B=1, C=2, D=3
              if (options[optionIndex]) {
                correctAnswer = options[optionIndex];
              }
            }
          } else if (q.question_type === 'true_false') {
            // 1/0 veya T/F değerlerini boolean'a dönüştür
            console.log('Veritabanından gelen doğru/yanlış değeri:', q.correct_answer);
            correctAnswer = q.correct_answer === '1' || q.correct_answer === 'T' || q.correct_answer === true;
            console.log('İşlenmiş doğru/yanlış değeri:', correctAnswer);
          }
          
          return {
            id: q.id || crypto.randomUUID(),
            question_text: q.question_text || '',
            question_type: (q.question_type as Question['question_type']) || 'multiple_choice',
            options: options,
            correct_answer: correctAnswer === undefined ? '' : correctAnswer,
            points: q.points || 1,
            exam_id: q.exam_id || examId
          };
        });
        
        setQuestions(formattedQuestions);
      } catch (err) {
        console.error('Error loading exam:', err);
        setError(err instanceof Error ? err.message : 'Sınav yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [examId]);

  // Load students useEffect'inden sonra ve Fetch all students fonksiyonundan önce ekleyelim
  // Load students
  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
      fetchAssignedStudents();
    }
  }, [activeTab, examId]);
  
  // URL parametresini kontrol et
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['details', 'questions', 'students'].includes(tabParam)) {
      setActiveTab(tabParam as 'details' | 'questions' | 'students');
    }
  }, []);

  // Fetch all students
  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          surname,
          student_code,
          department_id,
          departments:departments(name)
        `);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setStudents([]);
        return;
      }
      
      // Veri formatını doğru şekilde düzenliyoruz
      const formattedStudents: Student[] = data.map((student: any) => ({
        id: student.id,
        name: student.name,
        surname: student.surname,
        student_code: student.student_code || generateStudentCode(), // Eğer kod yoksa yeni üret
        department_id: student.department_id,
        department: student.departments ? { name: student.departments.name } : undefined
      }));
      
      setStudents(formattedStudents);
    } catch (error) {
      console.error('Öğrencileri getirme hatası:', error);
      toast.error('Öğrenciler yüklenirken bir hata oluştu');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch assigned students
  const fetchAssignedStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data: examStudentsData, error: examStudentsError } = await supabase
        .from('exam_students')
        .select(`
          id, 
          student_id,
          student_code,
          student:students(
            id,
            name,
            surname,
            student_code,
            department_id,
            department:departments(name)
          )
        `)
        .eq('exam_id', examId);
      
      if (examStudentsError) throw examStudentsError;
      
      if (!examStudentsData || examStudentsData.length === 0) {
        setAssignedStudents([]);
        return;
      }
      
      // Veri formatını doğru şekilde düzenliyoruz
      const formattedStudents: Student[] = examStudentsData.map((item: any) => ({
        id: item.student.id,
        name: item.student.name,
        surname: item.student.surname,
        student_code: item.student_code, // Sınava özel kodu kullanıyoruz
        department_id: item.student.department_id,
        department: item.student.department ? { name: item.student.department.name } : undefined
      }));
      
      setAssignedStudents(formattedStudents);
    } catch (error) {
      console.error('Atanmış öğrencileri getirme hatası:', error);
      toast.error('Atanmış öğrenciler yüklenirken bir hata oluştu');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Rastgele öğrenci kodu üretmek için fonksiyon
  const generateStudentCode = () => {
    // 6 karakterli alfanümerik kod oluştur
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Öğrenci ekleme işleminde kodu güncelleyerek ekliyoruz
  const addStudentToExam = async (student: Student) => {
    try {
      // Öğrencinin zaten atanmış olup olmadığını kontrol et
      const isAlreadyAssigned = assignedStudents.some(s => s.id === student.id);
      if (isAlreadyAssigned) {
        toast.error(`${student.name} ${student.surname} zaten bu sınava atanmış`);
        return;
      }
      
      // Eğer öğrencinin kodu yoksa veya boşsa, yeni kod oluştur
      let studentCode = student.student_code;
      if (!studentCode || studentCode === '-') {
        studentCode = generateStudentCode();
        
        // Öğrenci veritabanında kodu güncelle
        const { error: updateStudentError } = await supabase
          .from('students')
          .update({ student_code: studentCode })
          .eq('id', student.id);
        
        if (updateStudentError) {
          console.error('Öğrenci kodu güncellenirken hata:', JSON.stringify(updateStudentError, null, 2));
          // Hataya rağmen devam ediyoruz, çünkü yine de sınava atabiliriz
        }
      }
      
      // Veritabanına ekle - sınav ve öğrenci ilişkisi, özel kod ile
      const { error } = await supabase
        .from('exam_students')
        .insert({
          exam_id: examId,
          student_id: student.id,
          student_code: studentCode
        });
        
      if (error) {
        if (error.code === '23505') { // Unique constraint violation (zaten var)
          toast.error(`${student.name} ${student.surname} zaten bu sınava atanmış`);
          return;
        }
        throw error;
      }
      
      // Başarı mesajı göster
      toast.success(`${student.name} ${student.surname} sınava eklendi`);
      
      // Öğrenci nesnesini güncellenmiş kod ile tanımla
      const updatedStudent = { ...student, student_code: studentCode };
      
      // Atanmış öğrenciler listesini güncelle
      setAssignedStudents([...assignedStudents, updatedStudent]);
    } catch (err) {
      console.error('Öğrenci eklenirken hata:', err);
      toast.error('Öğrenci eklenirken bir hata oluştu');
    }
  };

  // Remove student from exam
  const removeStudentFromExam = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('exam_students')
        .delete()
        .eq('exam_id', examId)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      toast.success('Öğrenci sınavdan çıkarıldı');
      setAssignedStudents(assignedStudents.filter(s => s.id !== studentId));
    } catch (err) {
      console.error('Öğrenci çıkarılırken hata:', err);
      toast.error('Öğrenci çıkarılırken bir hata oluştu');
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const fullName = `${student.name} ${student.surname}`.toLowerCase();
      const departmentName = student.department?.name?.toLowerCase() || '';
      const studentCode = student.student_code?.toLowerCase() || '';
      
      return fullName.includes(searchTerm.toLowerCase()) || 
             departmentName.includes(searchTerm.toLowerCase()) ||
             studentCode.includes(searchTerm.toLowerCase());
    });
  }, [students, searchTerm]);

  // Handler for saving exam details
  const handleExamUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    setSaving(true);
    
    const loadingToast = toast.loading('Sınav güncelleniyor...');
    
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          is_active: exam.is_active,
          passing_grade: exam.passing_grade,
          start_date: exam.start_date,
          end_date: exam.end_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId);

      if (error) throw error;
      
      toast.dismiss(loadingToast);
      toast.success('Sınav başarıyla güncellendi');
      
      // Switch to questions tab after saving details
      setActiveTab('questions');
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Error updating exam:', err);
      setError(err instanceof Error ? err.message : 'Sınav güncellenirken bir hata oluştu');
      toast.error('Sınav güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // Edit existing question
  const handleQuestionEdit = (question: Question) => {
    setEditingQuestionId(question.id);
    setCurrentQuestion({
      ...question
    });
    setAddingQuestion(true);
    
    // Scroll to form
    setTimeout(() => {
      document.getElementById('question-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Delete a question
  const handleQuestionDelete = async (questionId: string) => {
    if (!confirm('Bu soruyu silmek istediğinizden emin misiniz?')) return;
    
    const loadingToast = toast.loading('Soru siliniyor...');
    
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);
      
      if (error) throw error;
      
      setQuestions(questions.filter(q => q.id !== questionId));
      
      toast.dismiss(loadingToast);
      toast.success('Soru başarıyla silindi');
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Error deleting question:', err);
      toast.error('Soru silinirken bir hata oluştu');
    }
  };

  // Reset question form
  const resetQuestionForm = () => {
    setCurrentQuestion({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    });
    setEditingQuestionId(null);
    setAddingQuestion(false);
  };

  // Handle option changes for multiple-choice questions
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  // Add a new option to multiple-choice question
  const addOption = () => {
    if (currentQuestion.options && currentQuestion.options.length < 8) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, '']
      });
    } else {
      toast.error('En fazla 8 seçenek eklenebilir');
    }
  };

  // Remove an option from multiple-choice question
  const removeOption = (index: number) => {
    if (currentQuestion.options && currentQuestion.options.length > 2) {
      const newOptions = currentQuestion.options.filter((_, i) => i !== index);
      
      // If removing the correct answer option, reset correct_answer
      const correctAnswerWasRemoved = currentQuestion.options[index] === currentQuestion.correct_answer;
      
      setCurrentQuestion({
        ...currentQuestion,
        options: newOptions,
        correct_answer: correctAnswerWasRemoved ? '' : currentQuestion.correct_answer
      });
    } else {
      toast.error('En az 2 seçenek bulunmalıdır');
    }
  };

  // Validate question form before saving
  const validateQuestion = () => {
    if (!currentQuestion.question_text?.trim()) {
      toast.error('Lütfen soru metnini giriniz');
      return false;
    }

    if (currentQuestion.question_type === 'multiple_choice') {
      if (!currentQuestion.options || currentQuestion.options.length < 2) {
        toast.error('Lütfen en az 2 seçenek giriniz');
        return false;
      }

      const emptyOptions = currentQuestion.options.filter(o => !o.trim());
      if (emptyOptions.length > 0) {
        toast.error('Boş seçenek bırakmayınız');
        return false;
      }

      if (!currentQuestion.correct_answer) {
        toast.error('Lütfen doğru cevabı seçiniz');
        return false;
      }
    } else if (currentQuestion.question_type === 'fill' && !currentQuestion.correct_answer) {
      toast.error('Lütfen doğru cevabı giriniz');
      return false;
    }

    if (!currentQuestion.points || currentQuestion.points < 1) {
      toast.error('Soru puanı en az 1 olmalıdır');
      return false;
    }

    return true;
  };

  // Save or update a question
  const handleSaveQuestion = async () => {
    if (!validateQuestion()) return;
    
    setSavingQuestions(true);
    const loadingToast = toast.loading(editingQuestionId ? 'Soru güncelleniyor...' : 'Soru ekleniyor...');
    
    try {
      // Map our question structure to database structure
      const questionData: any = {
        question_text: currentQuestion.question_text || '',
        question_type: currentQuestion.question_type || 'multiple_choice',
        points: currentQuestion.points || 1,
        exam_id: examId,
        // Tüm soru tipleri için veritabanındaki NOT NULL kısıtlaması nedeniyle seçenek alanlarını varsayılan değerlerle doldur
        option_a: '-',
        option_b: '-',
        option_c: '-',
        option_d: '-'
      };
      
      // Add options for multiple choice questions
      if (currentQuestion.question_type === 'multiple_choice' && currentQuestion.options) {
        questionData.option_a = currentQuestion.options[0] || '-';
        questionData.option_b = currentQuestion.options[1] || '-';
        questionData.option_c = currentQuestion.options[2] || '-';
        questionData.option_d = currentQuestion.options[3] || '-';
        
        // Convert correct_answer from full option text to letter (A, B, C, D)
        if (currentQuestion.correct_answer) {
          const correctOptionIndex = currentQuestion.options.findIndex(
            option => option === currentQuestion.correct_answer
          );
          if (correctOptionIndex >= 0) {
            // Use A, B, C, D based on index
            questionData.correct_answer = String.fromCharCode(65 + correctOptionIndex);
          }
        }
      } else if (currentQuestion.question_type === 'true_false') {
        // Doğru/yanlış soruları için - Artık seçenek alanları varsayılan değerlerle dolu
        questionData.option_a = 'Doğru';
        questionData.option_b = 'Yanlış';
        questionData.option_c = '-';
        questionData.option_d = '-';
        
        // Boolean değerleri 1/0 olarak kaydet (character(1) sütunu için)
        questionData.correct_answer = currentQuestion.correct_answer === true ? '1' : '0';
        console.log('Kaydedilen doğru/yanlış cevap (1/0):', questionData.correct_answer);
      } else {
        // Boşluk doldurma soruları için - Artık seçenek alanları varsayılan değerlerle dolu
        // For fill-in-the-blank questions
        questionData.correct_answer = currentQuestion.correct_answer === undefined ? '' : currentQuestion.correct_answer;
      }

      if (editingQuestionId) {
        // Update existing question
        const { data, error, status } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestionId);

        if (error) {
          console.error('Supabase hata detayı:', {
            kod: error.code,
            mesaj: error.message,
            detaylar: error.details,
            durum: status
          });
          throw new Error(`Veritabanı hatası: ${error.message}`);
        }
        
        // Update local state
        const updatedQuestions = questions.map(q => 
          q.id === editingQuestionId 
            ? { ...q, ...currentQuestion as Question } 
            : q
        );
        
        setQuestions(updatedQuestions);
        toast.dismiss(loadingToast);
        toast.success('Soru başarıyla güncellendi');
      } else {
        // Add new question
        const newQuestionId = crypto.randomUUID();
        questionData.id = newQuestionId;
        
        const { data, error, status } = await supabase
          .from('questions')
          .insert(questionData);

        if (error) {
          console.error('Supabase hata detayı:', {
            kod: error.code,
            mesaj: error.message,
            detaylar: error.details,
            durum: status
          });
          throw new Error(`Veritabanı hatası: ${error.message}`);
        }
        
        // Add to local state
        const newQuestion: Question = {
          id: newQuestionId,
          question_text: currentQuestion.question_text || '',
          question_type: currentQuestion.question_type || 'multiple_choice',
          options: currentQuestion.options || [],
          correct_answer: currentQuestion.correct_answer === undefined ? '' : currentQuestion.correct_answer,
          points: currentQuestion.points || 1,
          exam_id: examId
        };
        
        setQuestions([...questions, newQuestion]);
        toast.dismiss(loadingToast);
        toast.success('Soru başarıyla eklendi');
      }
      
      resetQuestionForm();
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('Error saving question:', err instanceof Error ? err.message : JSON.stringify(err));
      toast.error(`Soru kaydedilirken bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
    } finally {
      setSavingQuestions(false);
    }
  };
  
  // Handle question reordering with drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      
      const newOrder = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newOrder);
      
      // Here you would typically update the order in the database
      // This example doesn't persist the order since the database schema doesn't have an order field
      toast.success('Soru sırası güncellendi');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Sınav yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Hata Oluştu
              </h2>
              <p className="text-red-700 mb-4">
                {error || 'Sınav bulunamadı'}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/panel/sinavlar')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sınavlar Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  // Question form component
  const renderQuestionForm = () => (
    <div id="question-form" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              {editingQuestionId ? (
                <Edit2 className="w-5 h-5 text-blue-500" />
              ) : (
                <PlusCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {editingQuestionId ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
              </h3>
              <p className="text-sm text-slate-500">
                {editingQuestionId 
                  ? 'Mevcut soruyu güncelleyin' 
                  : 'Sınava yeni bir soru ekleyin'}
              </p>
            </div>
          </div>
          <button
            onClick={resetQuestionForm}
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6 space-y-5">
        {/* Question text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Soru Metni <span className="text-red-500">*</span>
          </label>
          <textarea
            value={currentQuestion.question_text || ''}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px]"
            placeholder="Sorunuzu detaylı bir şekilde yazın..."
          />
        </div>
        
        {/* Question type selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Soru Tipi <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-4 mb-4">
            <label className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all ${
              currentQuestion.question_type === 'multiple_choice'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}>
              <input
                type="radio"
                checked={currentQuestion.question_type === 'multiple_choice'}
                onChange={() => setCurrentQuestion({ 
                  ...currentQuestion, 
                  question_type: 'multiple_choice',
                  options: currentQuestion.options?.length ? currentQuestion.options : ['', '', '', ''],
                  correct_answer: ''
                })}
                className="sr-only"
              />
              <CheckSquare className="w-5 h-5" />
              <div>
                <span className="font-medium text-sm">Çoktan Seçmeli</span>
                <p className="text-xs opacity-70 mt-0.5">Birden fazla seçenek, tek doğru cevap</p>
              </div>
            </label>
            
            <label className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all ${
              currentQuestion.question_type === 'true_false'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}>
              <input
                type="radio"
                checked={currentQuestion.question_type === 'true_false'}
                onChange={() => setCurrentQuestion({ 
                  ...currentQuestion, 
                  question_type: 'true_false',
                  options: [],
                  correct_answer: true
                })}
                className="sr-only"
              />
              <HelpCircle className="w-5 h-5" />
              <div>
                <span className="font-medium text-sm">Doğru/Yanlış</span>
                <p className="text-xs opacity-70 mt-0.5">İfade doğru mu yanlış mı?</p>
              </div>
            </label>
            
            <label className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all ${
              currentQuestion.question_type === 'fill'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}>
              <input
                type="radio"
                checked={currentQuestion.question_type === 'fill'}
                onChange={() => setCurrentQuestion({ 
                  ...currentQuestion, 
                  question_type: 'fill',
                  options: [],
                  correct_answer: ''
                })}
                className="sr-only"
              />
              <Type className="w-5 h-5" />
              <div>
                <span className="font-medium text-sm">Boşluk Doldurma</span>
                <p className="text-xs opacity-70 mt-0.5">Kısa cevaplı sorular</p>
              </div>
            </label>
          </div>
        </div>
        
        {/* Multiple choice options */}
        {currentQuestion.question_type === 'multiple_choice' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Seçenekler <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addOption}
                type="button"
                className="flex items-center text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-50"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Seçenek Ekle
              </button>
            </div>
            
            <div className="space-y-3 mb-4">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full font-medium text-slate-700">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Seçenek \${index + 1}`}
                      className={`w-full pl-3.5 pr-12 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        currentQuestion.correct_answer === option
                          ? 'border-green-300 bg-green-50'
                          : 'border-slate-300'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={currentQuestion.correct_answer === option}
                        onChange={() => setCurrentQuestion({ ...currentQuestion, correct_answer: option })}
                        className="w-4 h-4 text-green-600 border-slate-300 focus:ring-green-500"
                      />
                      <button
                        onClick={() => removeOption(index)}
                        type="button"
                        className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>
                Doğru cevabın yanındaki daireyi işaretleyin.
              </span>
              <span>
                {currentQuestion.correct_answer 
                  ? `Doğru cevap: \${currentQuestion.correct_answer}`
                  : 'Henüz doğru cevap seçilmedi'}
              </span>
            </div>
          </div>
        )}
        
        {/* True/False selection */}
        {currentQuestion.question_type === 'true_false' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Doğru Cevap <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center gap-2.5 p-4 border rounded-lg cursor-pointer transition-all ${
                currentQuestion.correct_answer === true
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  checked={currentQuestion.correct_answer === true}
                  onChange={() => setCurrentQuestion({ ...currentQuestion, correct_answer: true })}
                  className="sr-only"
                />
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Doğru</span>
              </label>
              
              <label className={`flex-1 flex items-center gap-2.5 p-4 border rounded-lg cursor-pointer transition-all ${
                currentQuestion.correct_answer === false
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input
                  type="radio"
                  checked={currentQuestion.correct_answer === false}
                  onChange={() => setCurrentQuestion({ ...currentQuestion, correct_answer: false })}
                  className="sr-only"
                />
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Yanlış</span>
              </label>
            </div>
          </div>
        )}
        
        {/* Fill in the blank answer */}
        {currentQuestion.question_type === 'fill' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Doğru Cevap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={currentQuestion.correct_answer as string || ''}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
              placeholder="Doğru cevabı yazın"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Öğrencinin cevabı bu değerle tam olarak eşleşmelidir. Büyük/küçük harf duyarlılığına dikkat edin.
            </p>
          </div>
        )}
        
        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Puan <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentQuestion.points || 1}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
              min={1}
              max={100}
              className="w-28 px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-slate-500">
              Bu soru için verilecek puan değeri
            </span>
          </div>
        </div>
        
        {/* Form actions */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={resetQuestionForm}
            className="mr-3 px-4 py-2.5 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSaveQuestion}
            disabled={savingQuestions}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {savingQuestions ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{editingQuestionId ? 'Güncelleniyor...' : 'Ekleniyor...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{editingQuestionId ? 'Güncelle' : 'Kaydet'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/panel/sinavlar/' + examId)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                title="Geri dön"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-slate-800">Sınavı Düzenle</h1>
              {exam.is_active ? (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  Aktif
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  Pasif
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/panel/sinavlar/' + examId)}
                className="text-sm px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={activeTab === 'details' ? handleExamUpdate : () => router.push('/panel/sinavlar/' + examId)}
                disabled={saving}
                className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Değişiklikleri Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 -mb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Sınav Bilgileri
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Sorular ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Öğrenciler ({assignedStudents.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'details' ? (
          /* Exam Details Tab */
          <div className="space-y-6">
            {/* Basic info card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Sınav Detayları
                    </h2>
                    <p className="text-sm text-slate-500">
                      Sınavın temel bilgilerini düzenleyin
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Sınav Başlığı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exam.title}
                    onChange={(e) => setExam({ ...exam, title: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Örn: 2024 Bahar Dönemi Final Sınavı"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Açıklama
                  </label>
                  <textarea
                    value={exam.description}
                    onChange={(e) => setExam({ ...exam, description: e.target.value })}
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                    placeholder="Sınav hakkında açıklama yazın..."
                  />
                  <p className="text-xs text-slate-500">
                    Bu açıklama öğrencilere sınav hakkında bilgi verecektir.
                  </p>
                </div>
                
                {/* Duration */}
                <div className="max-w-xs space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Süre (dakika) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      value={exam.duration}
                      onChange={(e) => setExam({ ...exam, duration: parseInt(e.target.value) || 0 })}
                      required
                      min={1}
                      className="w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Öğrencinin sınavı tamamlaması için verilen süre.
                  </p>
                </div>
                
                {/* Passing grade */}
                <div className="max-w-xs space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Geçme Notu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Award className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      value={exam.passing_grade || 60}
                      onChange={(e) => setExam({ ...exam, passing_grade: parseInt(e.target.value) || 60 })}
                      min={0}
                      max={100}
                      className="w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Öğrencinin başarılı sayılması için alması gereken minimum puan (0-100).
                  </p>
                </div>
                
                {/* Status */}
                <div className="pt-2">
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={exam.is_active}
                      onChange={(e) => setExam({ ...exam, is_active: e.target.checked })}
                      className="h-5 w-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                      Sınav Aktif
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 ml-7">
                    Aktif edildiğinde öğrenciler bu sınava katılabilirler.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Department and dates info */}
            {(exam.department || exam.start_date || exam.end_date) && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Settings className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Ek Bilgiler
                      </h2>
                      <p className="text-sm text-slate-500">
                        Sınava ait diğer bilgiler
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exam.department && (
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Bölüm</dt>
                        <dd className="mt-1.5 text-base text-slate-800 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-slate-400" />
                          <span>{exam.department.name}</span>
                        </dd>
                      </div>
                    )}
                    
                    {exam.start_date && (
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Başlangıç Tarihi</dt>
                        <dd className="mt-1.5 text-base text-slate-800 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <span>{new Date(exam.start_date).toLocaleString('tr-TR')}</span>
                        </dd>
                      </div>
                    )}
                    
                    {exam.end_date && (
                      <div>
                        <dt className="text-sm font-medium text-slate-500">Bitiş Tarihi</dt>
                        <dd className="mt-1.5 text-base text-slate-800 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-slate-400" />
                          <span>{new Date(exam.end_date).toLocaleString('tr-TR')}</span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
            
            {/* Sınav Tarih ve Saat Ayarları */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Sınav Tarih ve Saatleri
                    </h2>
                    <p className="text-sm text-slate-500">
                      Sınavın başlangıç ve bitiş tarihlerini ayarlayın
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Başlangıç Tarihi ve Saati <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={exam.start_date ? new Date(exam.start_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setExam({ ...exam, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500">
                    Öğrencilerin sınava başlayabileceği tarih ve saat
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Bitiş Tarihi ve Saati <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={exam.end_date ? new Date(exam.end_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setExam({ ...exam, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500">
                    Sınavın bitiş tarihi ve saati
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'questions' ? (
          /* Questions Tab */
          <div className="space-y-6">
            {/* Questions Stats Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Soru Sayısı</h4>
                  <div className="flex items-center justify-center gap-2">
                    <List className="h-5 w-5 text-blue-500" />
                    <span className="text-2xl font-bold text-slate-800">{questions.length}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Toplam Puan</h4>
                  <div className="flex items-center justify-center gap-2">
                    <Award className="h-5 w-5 text-emerald-500" />
                    <span className="text-2xl font-bold text-slate-800">{totalPoints}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Çoktan Seçmeli</h4>
                  <div className="flex items-center justify-center gap-2">
                    <CheckSquare className="h-5 w-5 text-indigo-500" />
                    <span className="text-2xl font-bold text-slate-800">
                      {questions.filter(q => q.question_type === 'multiple_choice').length}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Diğer Sorular</h4>
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare className="h-5 w-5 text-amber-500" />
                    <span className="text-2xl font-bold text-slate-800">
                      {questions.filter(q => q.question_type !== 'multiple_choice').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add Question Button - only show if not currently adding/editing */}
            {!addingQuestion && !editingQuestionId && (
              <button
                type="button"
                onClick={() => setAddingQuestion(true)}
                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="font-medium">Yeni Soru Ekle</span>
              </button>
            )}
            
            {/* Question Form */}
            {(addingQuestion || editingQuestionId) && renderQuestionForm()}
            
            {/* Questions List */}
            {questions.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <List className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                          Sınav Soruları
                        </h2>
                        <p className="text-sm text-slate-500">
                          Sorular aşağıdaki sırada öğrencilere gösterilecektir
                        </p>
                      </div>
                    </div>
                    
                    {questions.length > 1 && (
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <MoveVertical className="w-4 h-4" />
                        <span>Sıralamayı değiştirmek için sürükleyip bırakın</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={questions.map(q => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {questions.map((question, index) => (
                        <SortableQuestionItem 
                          key={question.id}
                          question={question}
                          index={index}
                          onEdit={handleQuestionEdit}
                          onDelete={handleQuestionDelete}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-dashed border-slate-300">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">Bu Sınavda Soru Bulunmuyor</h3>
                <p className="text-slate-600 text-center mb-6 max-w-md">
                  Öğrencilerin yanıtlayabileceği sorular ekleyin. Her sınavda en az bir soru bulunmalıdır.
                </p>
                <button
                  type="button"
                  onClick={() => setAddingQuestion(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>İlk Soruyu Ekle</span>
                </button>
              </div>
            )}
            
            {/* Preview button */}
            {questions.length > 0 && (
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => router.push('/panel/sinavlar/' + examId)}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Sınav Önizleme</span>
                </button>
                
                <button
                  onClick={() => router.push('/panel/sinavlar/' + examId)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Değişiklikleri Kaydet</span>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'students' ? (
          <div className="space-y-6">
            {/* Atanmış öğrenciler kartı */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Atanmış Öğrenciler
                      </h2>
                      <p className="text-sm text-slate-500">
                        Bu sınava girebilecek öğrenciler
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-500">
                    Toplam: {assignedStudents.length} öğrenci
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {/* Arama kutusu */}
                <div className="mb-5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Öğrenci ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Atanmış öğrenciler listesi */}
                {assignedStudents.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Öğrenci
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Bölüm
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Giriş Kodu
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">İşlemler</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {assignedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-medium">
                                    {student.name.charAt(0) + student.surname.charAt(0)}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-slate-900">{student.name} {student.surname}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-600">{student.department?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded inline-block">
                                {student.student_code || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => removeStudentFromExam(student.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded-full p-1.5 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
                    <div className="p-3 bg-slate-100 text-slate-600 inline-flex rounded-full mb-4">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-slate-700 font-medium mb-2">Henüz öğrenci atanmamış</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      Bu sınava henüz öğrenci atanmamış. Aşağıdan öğrenci ekleyebilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Öğrenci ekleme kartı */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <UserPlus className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      Öğrenci Ekle
                    </h2>
                    <p className="text-sm text-slate-500">
                      Sisteme kayıtlı öğrencilerden sınava ekle
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {loadingStudents ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredStudents
                      .filter(student => !assignedStudents.some(assigned => assigned.id === student.id))
                      .map(student => (
                        <div key={student.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {student.name.charAt(0) + student.surname.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{student.name} {student.surname}</div>
                                <div className="text-xs text-slate-500">{student.department?.name || '-'}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => addStudentToExam(student)}
                              className="p-1.5 text-green-600 bg-green-50 rounded-full hover:bg-green-100 transition-colors"
                              title="Sınava ekle"
                            >
                              <PlusCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs bg-gray-100 text-gray-800 font-mono px-2 py-1 rounded inline-block">
                            {student.student_code || '-'}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                
                {!loadingStudents && filteredStudents.filter(student => !assignedStudents.some(assigned => assigned.id === student.id)).length === 0 && (
                  <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg">
                    <div className="p-3 bg-slate-100 text-slate-600 inline-flex rounded-full mb-4">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-slate-700 font-medium mb-2">Tüm öğrenciler atanmış</h3>
                    <p className="text-slate-500 mt-1">
                      Sisteme kayıtlı tüm öğrenciler bu sınava atanmış.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}