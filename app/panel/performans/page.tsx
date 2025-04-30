'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getActiveExamUsers, getExamStatistics } from '@/utils/db-optimizer'
import { 
  Loader2, 
  Activity, 
  Users, 
  Database,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react'

export default function PerformansIzleme() {
  const [loading, setLoading] = useState(true)
  const [activeExams, setActiveExams] = useState<any[]>([])
  const [connections, setConnections] = useState<any>(null)
  const [activeStudentCount, setActiveStudentCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedExam, setExpandedExam] = useState<string | null>(null)
  const [error, setError] = useState('')
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Aktif sınavları getir
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(`
          id, 
          title, 
          duration,
          is_active,
          created_at,
          department:departments(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (examError) throw examError
      
      setActiveExams(examData || [])
      
      // Aktif öğrenci sayısını hesapla
      let totalActive = 0
      
      if (examData && examData.length > 0) {
        for (const exam of examData) {
          const activeCount = await getActiveExamUsers(exam.id)
          exam.activeUsers = activeCount
          totalActive += activeCount
        }
        
        setActiveStudentCount(totalActive)
      }
      
      // Veritabanı bağlantılarını al
      const { data: connectionData, error: connError } = await supabase
        .rpc('active_connections')
      
      if (!connError) {
        setConnections(connectionData || [])
      }
      
    } catch (err: any) {
      setError('Veri yüklenirken bir hata oluştu: ' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }
  
  const refreshData = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }
  
  const toggleExamDetails = (examId: string) => {
    if (expandedExam === examId) {
      setExpandedExam(null)
    } else {
      setExpandedExam(examId)
    }
  }
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Performans verileri yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Sistem Performansı</h1>
        <button 
          onClick={refreshData}
          disabled={refreshing}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Yenile</span>
        </button>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Aktif Sınav */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="bg-blue-100 p-2 rounded-full">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-600">{activeExams.length}</span>
          </div>
          <h3 className="mt-2 text-lg font-medium text-slate-700">Aktif Sınav</h3>
          <p className="text-sm text-slate-500">Şu anda aktif olan sınav sayısı</p>
        </div>
        
        {/* Aktif Öğrenci */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="bg-emerald-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-emerald-600">{activeStudentCount}</span>
          </div>
          <h3 className="mt-2 text-lg font-medium text-slate-700">Aktif Öğrenci</h3>
          <p className="text-sm text-slate-500">Son 5 dakika içerisinde aktif olan öğrenci sayısı</p>
        </div>
        
        {/* Veritabanı Bağlantıları */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-start justify-between">
            <div className="bg-purple-100 p-2 rounded-full">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {connections ? 
                connections[0]?.active_connections || 0 : 
                '-'
              }
              <span className="text-sm font-normal text-slate-500 ml-1">/ {connections ? connections[0]?.total_connections || 0 : '-'}</span>
            </span>
          </div>
          <h3 className="mt-2 text-lg font-medium text-slate-700">DB Bağlantıları</h3>
          <p className="text-sm text-slate-500">Aktif veritabanı bağlantıları / Toplam</p>
        </div>
      </div>
      
      {/* Aktif Sınavlar */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Aktif Sınavlar</h2>
      
      {activeExams.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
          Şu anda aktif sınav bulunmuyor.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-200">
          {activeExams.map((exam) => (
            <div key={exam.id} className="p-0">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
                onClick={() => toggleExamDetails(exam.id)}
              >
                <div>
                  <h3 className="font-medium text-slate-800">{exam.title}</h3>
                  <p className="text-sm text-slate-500">{exam.department?.name || 'Bölüm bilgisi yok'}</p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{exam.activeUsers || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{exam.duration} dk</span>
                  </div>
                  
                  {expandedExam === exam.id ? (
                    <ChevronUp className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </div>
              </div>
              
              {expandedExam === exam.id && (
                <div className="px-4 pb-4 pt-1">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Eş Zamanlı Öğrenci Durumu</h4>
                    
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-1 w-full">
                      <div 
                        className={`h-full rounded-full ${
                          exam.activeUsers > 40 ? 'bg-red-500' : 
                          exam.activeUsers > 20 ? 'bg-amber-500' : 
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min((exam.activeUsers / 50) * 100, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>0</span>
                      <span className={`font-medium ${
                        exam.activeUsers > 40 ? 'text-red-700' : 
                        exam.activeUsers > 20 ? 'text-amber-700' : 
                        'text-emerald-700'
                      }`}>
                        {exam.activeUsers} öğrenci
                      </span>
                      <span>50</span>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <a 
                        href={`/panel/sinavlar/${exam.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Sınav detaylarını görüntüle
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Veritabanı Performansı */}
      <h2 className="text-xl font-bold text-slate-800 mb-4 mt-8">Veritabanı Performansı</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-2 font-medium text-slate-700">Veritabanı</th>
              <th className="px-4 py-2 font-medium text-slate-700">Toplam Bağlantı</th>
              <th className="px-4 py-2 font-medium text-slate-700">Aktif Bağlantı</th>
              <th className="px-4 py-2 font-medium text-slate-700">Boşta Bağlantı</th>
              <th className="px-4 py-2 font-medium text-slate-700">Kullanım (%)</th>
            </tr>
          </thead>
          <tbody>
            {connections ? (
              connections.map((conn: any, index: number) => {
                const usagePercent = conn.total_connections > 0 
                  ? (conn.active_connections / conn.total_connections) * 100 
                  : 0
                
                return (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="px-4 py-3">{conn.db_name}</td>
                    <td className="px-4 py-3">{conn.total_connections}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{conn.active_connections}</td>
                    <td className="px-4 py-3">{conn.idle_connections}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              usagePercent > 70 ? 'bg-red-500' : 
                              usagePercent > 40 ? 'bg-amber-500' : 
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{Math.round(usagePercent)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-center text-slate-500">
                  Veritabanı bağlantı bilgileri yüklenemedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-slate-500">
        <p>
          <strong>Not:</strong> Görüntülenen performans verileri yaklaşık değerlerdir ve sistem yüküne bağlı olarak değişebilir.
          Daha detaylı veritabanı performans analizi için Supabase kontrol panelini ziyaret edin.
        </p>
      </div>
    </div>
  )
} 