// Bu dosya büyük ihtimalle doğrudan kullanılmıyor, main route olarak düşünülebilir
// Doğrudan /exam URL'ine gidildiğinde bu sayfayı gösterir

import { redirect } from 'next/navigation';

export default function ExamPage() {
  // Doğrudan sınav sayfasına gidildiğinde exam-login sayfasına yönlendir
  redirect('/exam-login');
}
