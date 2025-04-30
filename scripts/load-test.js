/**
 * SINAVSISTEMI YÜK TESTİ
 * 
 * Bu script, sınav sisteminin eş zamanlı kullanıcı yükünü test etmek için 
 * birden fazla öğrencinin aynı anda sınava girmesini simüle eder.
 * 
 * Kullanım: node scripts/load-test.js
 */

const fetch = require('node-fetch');
const colors = require('colors/safe');
const readline = require('readline');

// Yapılandırma
const config = {
  // Test edilecek sunucu URL'si
  baseUrl: 'http://localhost:3000',
  
  // Sınav ID'si ve öğrenci kodları (test öğrencileri)
  examId: '', // Buraya test edilecek sınav ID'sini girin
  studentCodes: [], // Buraya test öğrenci kodlarını girin
  
  // Test ayarları
  concurrentUsers: 10, // Eş zamanlı kullanıcı sayısı
  requestsPerUser: 20, // Her kullanıcı için yapılacak istek sayısı
  delayBetweenRequests: 500, // Her istek arasındaki gecikme (ms)
  
  // Ek istek başlıkları
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'AcadeZone-LoadTest/1.0',
  }
};

// İstatistikler
let stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  startTime: null,
  endTime: null,
  responseTimes: [],
};

// Renk fonksiyonları
const formatSuccess = (text) => colors.green(text);
const formatError = (text) => colors.red(text);
const formatWarning = (text) => colors.yellow(text);
const formatInfo = (text) => colors.cyan(text);
const formatHeader = (text) => colors.bold.blue(text);

// Terminal temizle
const clearScreen = () => {
  const lines = process.stdout.getWindowSize()[1];
  for (let i = 0; i < lines; i++) {
    console.log('\r\n');
  }
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
};

// İstatistikleri yazdır
const printStats = () => {
  const durationMs = stats.endTime ? stats.endTime - stats.startTime : Date.now() - stats.startTime;
  const durationSec = durationMs / 1000;
  
  const requestsPerSecond = stats.totalRequests / durationSec;
  const avgResponseTime = stats.responseTimes.length > 0 
    ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length 
    : 0;
  
  console.log(formatHeader('\n=== YÜK TESTİ İSTATİSTİKLERİ ==='));
  console.log(formatInfo(`Toplam İstek: ${stats.totalRequests}`));
  console.log(formatSuccess(`Başarılı İstek: ${stats.successfulRequests}`));
  console.log(formatError(`Başarısız İstek: ${stats.failedRequests}`));
  console.log(formatInfo(`Saniyedeki İstek: ${requestsPerSecond.toFixed(2)}/sn`));
  console.log(formatInfo(`Ortalama Yanıt Süresi: ${avgResponseTime.toFixed(2)}ms`));
  console.log(formatInfo(`Toplam Süre: ${durationSec.toFixed(2)} saniye`));
  
  // Başarı oranı
  const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
  if (successRate >= 95) {
    console.log(formatSuccess(`Başarı Oranı: %${successRate.toFixed(2)}`));
  } else if (successRate >= 80) {
    console.log(formatWarning(`Başarı Oranı: %${successRate.toFixed(2)}`));
  } else {
    console.log(formatError(`Başarı Oranı: %${successRate.toFixed(2)}`));
  }
};

// İlerleme durumunu yazdır
const printProgress = (current, total) => {
  const percent = Math.floor((current / total) * 100);
  const progressBar = Array(Math.floor(percent / 2)).fill('█').join('') + Array(50 - Math.floor(percent / 2)).fill('░').join('');
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`İlerleme: ${progressBar} ${percent}% (${current}/${total})`);
};

// Tek bir kullanıcı simülasyonu
const simulateUser = async (userIndex, studentCode) => {
  console.log(formatInfo(`[Kullanıcı ${userIndex + 1}] Başlatılıyor: Öğrenci Kodu = ${studentCode}`));
  
  try {
    // 1. Giriş yap
    console.log(formatInfo(`[Kullanıcı ${userIndex + 1}] Sınava giriş yapılıyor...`));
    const loginResponse = await fetch(`${config.baseUrl}/api/exam-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...config.headers
      },
      body: `student-code=${studentCode}`
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Giriş başarısız: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    // 2. Sınav sayfasını yükle
    console.log(formatInfo(`[Kullanıcı ${userIndex + 1}] Sınav sayfası yükleniyor...`));
    const examUrl = `${config.baseUrl}/sinav/${config.examId}?code=${studentCode}`;
    
    // 3. Soruları simüle et ve cevapla
    for (let i = 0; i < config.requestsPerUser; i++) {
      const startTime = Date.now();
      
      // Soru sayfasını getir
      const examResponse = await fetch(examUrl, {
        headers: config.headers
      });
      
      if (!examResponse.ok) {
        throw new Error(`Soru getirme başarısız: ${examResponse.status}`);
      }
      
      // Cevap gönderme (aslında sadece istek simüle ediyoruz)
      const questionId = `q${Math.floor(Math.random() * 20)}`; // Rastgele soru ID
      const answerUrl = `${config.baseUrl}/api/save-answer`;
      
      const answerResponse = await fetch(answerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify({
          examId: config.examId,
          questionId,
          studentCode,
          answer: `answer-${Math.floor(Math.random() * 4)}`
        })
      });
      
      const endTime = Date.now();
      stats.responseTimes.push(endTime - startTime);
      
      if (answerResponse.ok) {
        stats.successfulRequests++;
      } else {
        stats.failedRequests++;
        console.log(formatError(`[Kullanıcı ${userIndex + 1}] Cevap gönderme hatası: ${answerResponse.status}`));
      }
      
      stats.totalRequests++;
      printProgress(stats.totalRequests, config.concurrentUsers * config.requestsPerUser);
      
      // İstekler arasında gecikme
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenRequests));
    }
    
    console.log(formatSuccess(`[Kullanıcı ${userIndex + 1}] Test tamamlandı!`));
  } catch (error) {
    console.log(formatError(`[Kullanıcı ${userIndex + 1}] Hata: ${error.message}`));
    stats.failedRequests += (config.requestsPerUser - stats.successfulRequests - stats.failedRequests);
    stats.totalRequests += (config.requestsPerUser - stats.successfulRequests - stats.failedRequests);
  }
};

// Ana test fonksiyonu
const runLoadTest = async () => {
  clearScreen();
  console.log(formatHeader('=== SINAV SİSTEMİ YÜK TESTİ ==='));
  console.log(formatInfo(`Sunucu: ${config.baseUrl}`));
  console.log(formatInfo(`Sınav ID: ${config.examId}`));
  console.log(formatInfo(`Eş zamanlı kullanıcı: ${config.concurrentUsers}`));
  console.log(formatInfo(`Kullanıcı başına istek: ${config.requestsPerUser}`));
  console.log(formatInfo(`Toplam istek: ${config.concurrentUsers * config.requestsPerUser}`));
  console.log(formatHeader('=============================='));
  
  if (!config.examId) {
    console.log(formatError('HATA: Sınav ID girilmedi. Lütfen config.examId değerini ayarlayın.'));
    return;
  }
  
  if (config.studentCodes.length === 0) {
    console.log(formatError('HATA: Öğrenci kodları girilmedi. Lütfen config.studentCodes değerini ayarlayın.'));
    return;
  }
  
  if (config.studentCodes.length < config.concurrentUsers) {
    console.log(formatWarning(`UYARI: Öğrenci kodu sayısı (${config.studentCodes.length}), eş zamanlı kullanıcı sayısından (${config.concurrentUsers}) az. Bazı kodlar tekrar kullanılacak.`));
  }
  
  // Testi başlat
  stats.startTime = Date.now();
  
  // Kullanıcıları hazırla
  const userPromises = [];
  for (let i = 0; i < config.concurrentUsers; i++) {
    // Öğrenci kodunu al (döngüsel olarak)
    const studentCode = config.studentCodes[i % config.studentCodes.length];
    
    // Kullanıcı simülasyonunu başlat
    userPromises.push(simulateUser(i, studentCode));
    
    // Kullanıcılar arasında kısa bir gecikme
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Tüm kullanıcıları bekle
  await Promise.all(userPromises);
  
  // Test bitişi
  stats.endTime = Date.now();
  
  // Sonuçları yazdır
  printStats();
};

// Testi başlat
runLoadTest().catch(error => {
  console.error(formatError(`Test sırasında hata oluştu: ${error.message}`));
}); 