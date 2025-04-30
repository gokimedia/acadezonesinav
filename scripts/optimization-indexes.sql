-- Performans Optimizasyonları için SQL Betiği
-- Bu betik, veritabanı performansını artırmak için gerekli indeksleri ve yapılandırmaları içerir
-- Supabase Pro/Team hesapları için uygulanabilir

-- 1. Performans için Tablo İndeksleri
------------------------------------------------------------------------------

-- Öğrenci sınav kodu indeksi (bu alan sık sık kullanılır - exam_students tablosunda)
CREATE INDEX IF NOT EXISTS idx_exam_students_student_code 
ON "public"."exam_students" ("student_code");

-- Sınavlara göre sorulara hızlı erişim indeksi
CREATE INDEX IF NOT EXISTS idx_questions_exam_id 
ON "public"."questions" ("exam_id");

-- Sınav ve öğrenci ID'si kombinasyonuna göre cevaplara erişim için indeks
CREATE INDEX IF NOT EXISTS idx_answers_exam_student 
ON "public"."answers" ("exam_id", "student_id");

-- Öğrenci cevaplarına doğruluk durumuna göre hızlı erişim
CREATE INDEX IF NOT EXISTS idx_answers_is_correct 
ON "public"."answers" ("is_correct");

-- Departman adına göre indeks
CREATE INDEX IF NOT EXISTS idx_departments_name 
ON "public"."departments" ("name");

-- Kullanılmayan indeksleri düşün (dikkatli kullanın)
-- Gerekirse ilgili indekse uygulayın: DROP INDEX IF EXISTS idx_name;

-- 2. Yeni Performans Tabloları
------------------------------------------------------------------------------

-- Eş zamanlı öğrenci oturumlarını takip etmek için yeni tablo
CREATE TABLE IF NOT EXISTS "public"."student_exam_sessions" (
  "exam_id" UUID REFERENCES "public"."exams"("id") ON DELETE CASCADE,
  "student_id" UUID REFERENCES "public"."students"("id") ON DELETE CASCADE,
  "last_activity" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("exam_id", "student_id")
);

-- Oturum tablosu için etkinlik indeksi
CREATE INDEX IF NOT EXISTS idx_student_exam_sessions_activity 
ON "public"."student_exam_sessions" ("last_activity");

-- Sınav sonuçları önbelleği (hesaplanmış sonuçları saklama tablosu)
CREATE TABLE IF NOT EXISTS "public"."exam_result_cache" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "exam_id" UUID REFERENCES "public"."exams"("id") ON DELETE CASCADE,
  "student_id" UUID REFERENCES "public"."students"("id") ON DELETE CASCADE,
  "score" NUMERIC(5,2) NOT NULL,
  "correct_count" INTEGER NOT NULL,
  "wrong_count" INTEGER NOT NULL,
  "total_questions" INTEGER NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE ("exam_id", "student_id")
);

-- RLS Politikaları - Yeni tablolara güvenlik ekleme
ALTER TABLE "public"."student_exam_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."exam_result_cache" ENABLE ROW LEVEL SECURITY;

-- DÜZELTME: user_profiles tablosu mevcut değil, auth.users ve auth.role kullanıyoruz
CREATE POLICY "Sistem oturumlarına sadece yöneticiler erişebilir"
ON "public"."student_exam_sessions"
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE role = 'admin'
  )
);

CREATE POLICY "Sonuç önbelleğine sadece yöneticiler erişebilir"
ON "public"."exam_result_cache"
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE role = 'admin'
  )
);

-- 3. Performans ayarları (Supabase Pro/Team hesapları için uygulanabilir)
------------------------------------------------------------------------------

-- VACUUM ve ANALİZ zamanlamasını artırma (Supabase kontrol panelinden ayarlanabilir)
-- VACUUM ANALYZE "public"."answers";
-- VACUUM ANALYZE "public"."exam_students";
-- VACUUM ANALYZE "public"."questions";

-- 4. Eş zamanlı bağlantıları izlemek için fonksiyon
------------------------------------------------------------------------------

-- Aktif bağlantıları izleme fonksiyonu
CREATE OR REPLACE FUNCTION public.active_connections()
RETURNS TABLE (
  db_name TEXT,
  total_connections BIGINT,
  active_connections BIGINT,
  idle_connections BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_database.datname as db_name,
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections
  FROM pg_stat_activity
  JOIN pg_database ON pg_database.oid = pg_stat_activity.datid
  GROUP BY pg_database.datname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uzun süren sorguları izleme fonksiyonu
CREATE OR REPLACE FUNCTION public.long_running_queries(threshold_seconds INT DEFAULT 5)
RETURNS TABLE (
  pid INT,
  duration INTERVAL,
  query TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pid::INT,
    now() - query_start as duration,
    query
  FROM pg_stat_activity
  WHERE state = 'active'
    AND now() - query_start > (threshold_seconds * interval '1 second')
    AND query NOT LIKE '%long_running_queries%'
  ORDER BY duration DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sınav performans istatistiklerini döndüren fonksiyon
CREATE OR REPLACE FUNCTION public.exam_performance_stats(exam_id_param UUID)
RETURNS TABLE (
  total_students INT,
  avg_score NUMERIC,
  max_score NUMERIC,
  min_score NUMERIC,
  concurrent_users INT
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(DISTINCT student_id) as students_count,
      AVG(score) as average_score,
      MAX(score) as maximum_score,
      MIN(score) as minimum_score
    FROM "public"."results"
    WHERE exam_id = exam_id_param
  ),
  concurrent AS (
    SELECT 
      COUNT(DISTINCT student_id) as current_users
    FROM "public"."student_exam_sessions"
    WHERE exam_id = exam_id_param
    AND last_activity > (now() - interval '5 minutes')
  )
  SELECT 
    stats.students_count,
    stats.average_score,
    stats.maximum_score,
    stats.minimum_score,
    concurrent.current_users
  FROM stats, concurrent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 