export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string | null
          active: boolean
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string | null
          active?: boolean
        }
      }
      students: {
        Row: {
          id: string
          student_number: string
          name: string
          surname: string
          department_id: string | null
          created_at: string
          updated_at: string | null
          active: boolean
        }
        Insert: {
          id?: string
          student_number: string
          name: string
          surname: string
          department_id?: string | null
          created_at?: string
          updated_at?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          student_number?: string
          name?: string
          surname?: string
          department_id?: string | null
          created_at?: string
          updated_at?: string | null
          active?: boolean
        }
      }
      exams: {
        Row: {
          id: string
          title: string
          description: string | null
          department_id: string | null
          start_date: string | null
          end_date: string | null
          duration: number | null
          passing_grade: number | null
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          department_id?: string | null
          start_date?: string | null
          end_date?: string | null
          duration?: number | null
          passing_grade?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          department_id?: string | null
          start_date?: string | null
          end_date?: string | null
          duration?: number | null
          passing_grade?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: string
          points: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          exam_id: string
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: string
          points?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          exam_id?: string
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_answer?: string
          points?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      answers: {
        Row: {
          id: string
          exam_id: string
          question_id: string
          student_id: string
          student_answer: string | null
          is_correct: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          question_id: string
          student_id: string
          student_answer?: string | null
          is_correct?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          question_id?: string
          student_id?: string
          student_answer?: string | null
          is_correct?: boolean | null
          created_at?: string
        }
      }
      exam_students: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          student_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          student_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          student_code?: string | null
          created_at?: string
        }
      }
      results: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          score: number | null
          correct_count: number
          wrong_count: number
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          score?: number | null
          correct_count?: number
          wrong_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          score?: number | null
          correct_count?: number
          wrong_count?: number
          created_at?: string
        }
      }
      exam_results: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          score: number | null
          start_time: string | null
          end_time: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          score?: number | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          score?: number | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}