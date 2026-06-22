# STEMA + PLAN.EX Entegrasyonu Master Proje Planı (TASKS.md)

Bu doküman, Firebase'den temizlenmiş ve Supabase tabanlı hale getirilecek olan PLAN.EX projesinin üzerine STEMA (Sokratik STEM Öğrenme Platformu) modülünün entegre edilmesi için gereken tüm adımları ve fazları içermektedir.

---

## Planın Temel Yapısı
Her faz kendi içinde alt görevlere (`0.1`, `0.2`, `1.1` vb.) ayrılmıştır. Her ana fazın sonunda projenin stabilitesini ve doğruluğunu garanti altına alacak bir **KONTROL GÖREVİ** bulunmaktadır. Bir sonraki faza geçmeden önce kontrol görevi tamamlanmalıdır.

---

## 🗺 Stratejik Yol Haritası & Öncelikler

Astra AI gibi rakiplere karşı en büyük rekabetçi avantajlar şunlardır:
1. **Kendi Materyalini Ekleme (RAG):** Kullanıcının kendi ders notlarını/PDF'lerini ekleyip bunlar üzerinden çalışabilmesi.
2. **Gelişmiş Mastery Tracking:** `concept_mastery` + `FSRS` + `error_logs` ile öğrenme derinliğinin ölçülmesi.
3. **Maliyet Optimizasyonu:** DeepSeek V4 entegrasyonu ile LLM maliyetlerinin dramatik ölçüde (30 kata kadar) düşürülmesi.

Bu doğrultuda, platformun geliştirme süreci ve fazları iki dalgaya ayrılmıştır:

> [!IMPORTANT]
> **1. DALGA: Çekirdek Akış, Maliyet Optimizasyonu ve Canlıya Geçiş (En Yüksek Öncelik)**
> - **Phase 17.1-17.2 (DeepSeek Geçişi & LLM Abstraction):** API maliyetlerini düşürmek ve Feynman/Sokratik modelleri ayrıştırmak için ilk etapta yapılacaktır.
> - **Phase 9 (Mapping Mode) & Phase 10 (RAG & pgvector):** Rakiplere karşı en güçlü silah olan RAG ve zihin haritası entegrasyonu tamamlanacaktır.
> - **Phase 16 (Güvenlik, Test ve Production Deploy):** Canlıya çıkış ve ilk kullanıcı geri bildirimlerinin toplanması.

> [!NOTE]
> **2. DALGA: Derinleşme, Mobilizasyon ve Kişiselleştirme (İkinci Aşama)**
> - **Phase 12 (CS & Algoritma Sandbox)**
> - **Phase 13 (Sınav Üretici & Aralıklı Pratik)**
> - **Phase 14 (INCUP & DEHB Adaptasyonları)**
> - **Phase 18 (Gelişmiş Onboarding & Hazır Kavram Ağaçları)**
> - **Phase 19 (PWA & Mobil Uyumlaştırma)**

---

## 🛠 PHASE 0: Proje Stabilizasyonu (Firebase Temizliği & Supabase Bağlantısı)
Firebase'in tamamen temizlenmesi, kalan referansların kaldırılması ve Supabase Auth entegrasyonu ile projenin derlenebilir ve çalışabilir hale getirilmesi.

- [x] **0.1: Kalan Firebase İthalatlarının ve Referanslarının Temizlenmesi**
  - [x] `src/lib/cloud/plannerRepo.ts` içindeki Firebase dependency'lerini kaldır/temizle.
  - [x] `src/lib/cloud/trackerRepo.ts` içindeki Firebase dependency'lerini kaldır/temizle.
  - [x] `src/lib/cloud/remoteDefaults.ts` içindeki Firebase import'larını temizle.
  - [x] `src/modules/auth/store/authStore.ts` içindeki Firebase Auth bağımlılıklarını kaldır.
  - [x] `src/modules/auth/pages/AuthPage.tsx` ve `AuthCallbackPage.tsx` içindeki Firebase kodlarını temizle.
  - [x] `src/modules/settings/pages/Settings.tsx` ve `src/modules/settings/store/settingsStore.ts` içindeki Firebase bağlantılarını temizle.
  - [x] `src/modules/tracker/lib/exportService.ts` içindeki Firebase veri aktarım kodlarını temizle.
  - [x] `src/i18n/locales/en/auth.json` ve `tr/auth.json` içindeki Firebase hata ve durum mesajlarını güncelle.
- [x] **0.2: Supabase Client Yapılandırması**
  - [x] `src/config/supabase.ts` dosyasını oluştur ve `@supabase/supabase-js` client'ını başlat.
  - [x] `.env.local` dosyasına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değişkenlerini ekle.
  - [x] Hatalı veya eksik env durumunda güvenli fallback yapılarını kur.
- [x] **0.3: Supabase Auth Entegrasyonu**
  - [x] Google ve GitHub OAuth sağlayıcıları ile giriş akışını `authStore.ts` içinde yeniden yaz.
  - [x] Kullanıcı oturum durumunu (`onAuthStateChange`) dinleyen mekanizmayı kur.
  - [x] Login, logout ve session yenileme (refresh token) mantığını test et.
- [x] **0.4: Ortam Değişkenleri ve Derleme Doğrulaması**
  - [x] `tsconfig.json` ve Vite yapılandırmasının düzgün çalıştığını doğrula.
  - [x] `npm run dev` ile uygulamayı lokalde başlat ve hata vermediğinden emin ol.

### ✅ KONTROL GÖREVİ (Phase 0):
- [x] Firebase referansı içeren hiçbir dosya kalmadı.
- [x] Proje yerelde (`npm run dev`) hatasız derleniyor.
- [x] Supabase Auth ile (Google veya GitHub üzerinden) sisteme giriş yapılabiliyor ve kullanıcı session bilgisi consola yazdırılabiliyor. (Lokalde Supabase URL/Key girilerek test edilmiştir)

---

## 🗄 PHASE 1: Supabase Veritabanı Şeması & RLS Politikaları
Projenin ihtiyaç duyduğu tüm ilişkisel ve vektörel (pgvector) veritabanı şemasının Supabase üzerinde oluşturulması ve güvenlik politikalarının yazılması.

- [x] **1.1: Supabase eklentileri (Extensions) Kurulumu**
  - [x] `pgvector` eklentisini aktif et (RAG vektör aramaları için).
  - [x] `uuid-ossp` eklentisini aktif et.
- [x] **1.2: Temel Kullanıcı ve Profil Tabloları**
  - [x] `profiles` tablosu (id, email, full_name, avatar_url, updated_at).
  - [x] `profiles` için otomatik tetikleyici (trigger) oluştur (auth.users tablosuna yeni kayıt düştüğünde).
- [x] **1.3: STEMA Öğrenme ve Sohbet Tabloları**
  - [x] `sessions` tablosu (id, user_id, title, status, created_at).
  - [x] `messages` tablosu (id, session_id, role, content, raw_response, token_cost, prompt_tokens, latency_ms, created_at).
- [x] **1.4: Kavram Hakimiyeti ve Hata Analizi Tabloları**
  - [x] `concepts` tablosu (id, code, name, description, prerequisite_id).
  - [x] `concept_mastery` tablosu (id, user_id, concept_id, score, confidence_interval, evidence_count, updated_at).
  - [x] `error_logs` tablosu (id, user_id, concept_id, error_type, raw_user_answer, model_feedback, created_at).
- [x] **1.5: FSRS (Flashcard & Spaced Repetition) Tablosu**
  - [x] `sr_cards` tablosu (id, user_id, concept_id, front, back, difficulty, stability, retrievability, state, reps, lapses, last_review, due_at).
- [x] **1.6: RAG Dokümanları ve Embedding Tablosu**
  - [x] `documents` tablosu (id, user_id, title, file_path, file_type, size, created_at).
  - [x] `document_chunks` tablosu (id, document_id, content, embedding [vector(1536 veya 384)], metadata [jsonb]).
- [x] **1.7: Görselleştirme ve İzleme Tabloları**
  - [x] `mindmaps` tablosu (id, user_id, session_id, name, nodes [jsonb], edges [jsonb], created_at).
  - [x] `tutor_events` tablosu (id, user_id, event_type, payload [jsonb], created_at) (Metakognitif ölçümler için).
- [x] **1.8: Row Level Security (RLS) Tanımlamaları**
  - [x] Tüm tablolarda `user_id` eşleşmesine göre sadece sahibinin okuyup yazabileceği RLS politikalarını yaz.
  - [x] Migration dosyalarını `supabase/migrations/` altında sürüm kontrolüne al.

### ✅ KONTROL GÖREVİ (Phase 1):
- [x] Supabase CLI veya Dashboard üzerinden veritabanı şeması başarıyla uygulandı.
- [x] RLS test edildi: Bir kullanıcı başka bir kullanıcının verilerine (message, mindmap, doc vb.) erişemiyor.
- [x] pgvector eklentisinin aktif olduğu sorgular ile test edildi.

---

## 🔄 PHASE 2: PLAN.EX Planner/Tracker Supabase Geçişi
PLAN.EX'in mevcut planlayıcı, alışkanlık takipçi ve ayarlar sisteminin Firebase'den Supabase SQL yapılarına taşınması.

- [x] **2.1: `plannerRepo.ts` Supabase Entegrasyonu**
  - [x] Görevler (tasks) ve Planlar (plans) için gerekli Supabase tablolarını oluştur (`planner_tasks`, `planner_plans`).
  - [x] `plannerRepo.ts` içindeki CRUD operasyonlarını Supabase sorgularıyla değiştir.
- [x] **2.2: `trackerRepo.ts` Supabase Entegrasyonu**
  - [x] Alışkanlıklar (habits) ve Günlük Kayıtlar (logs) için Supabase tablolarını oluştur (`tracker_habits`, `tracker_logs`).
  - [x] `trackerRepo.ts` içindeki veri yazma ve okuma metodlarını güncelle.
- [x] **2.3: Dexie/IndexedDB Hibrit Senkronizasyon Yapısı**
  - [x] Çevrimdışı destek için IndexedDB kullanan yapıyı incele ve Supabase ile "online-first, offline-cache" mantığında çalışacak şekilde senkronize et.
- [x] **2.4: `settingsStore` Taşınması**
  - [x] Kullanıcı tercihleri ve ayarlarını Supabase `profiles` tablosuna veya `user_settings` tablosuna kaydet.
- [x] **2.5: Veri Bootstrapping Mekanizması**
  - [x] İlk kez kaydolan bir kullanıcıya varsayılan planlayıcı şablonlarının ve örnek görevlerin yüklenmesini sağla.

### ✅ KONTROL GÖREVİ (Phase 2):
- [x] PLAN.EX planlayıcı ekranında eklenen bir görev Supabase veritabanındaki `planner_tasks` tablosuna anında kaydediliyor.
- [x] Alışkanlık takibi verileri yerel cache ve bulut veritabanı arasında başarıyla senkronize oluyor.

---

## 🎨 PHASE 3: /learn Modülü Frontend İskeleti & Arayüzü
STEMA özelliklerinin barındırılacağı `/learn` ana modülünün tasarımı, rota tanımlamaları ve ortak arayüz bileşenlerinin oluşturulması.

- [x] **3.1: Klasör Yapısının Kurulması**
  - [x] `src/modules/learn/` altında `pages/`, `components/`, `store/`, `hooks/` klasörlerini oluştur.
- [x] **3.2: Router ve Navigasyon Entegrasyonu**
  - [x] Mevcut router dosyasında `/learn` rotasını ve alt rotalarını (chat, mindmap, dashboard, sandbox) tanımla.
  - [x] Kenar çubuğuna (Sidebar) "Learn" veya "STEMA" sekmesini modern bir ikonla ekle.
- [x] **3.3: Ders Detay Sayfasına Sokratik Giriş Noktası Ekleme**
  - [x] PLAN.EX ders/konu görünümüne "Sokratik Çöz / Learn ile Keşfet" butonu yerleştir.
- [x] **3.4: Matematiksel Gösterim (KaTeX) Kurulumu**
  - [x] `react-katex` ve `katex` paketlerinin düzgün yüklendiğini doğrula.
  - [x] Satır içi (`$...$`) ve blok (`$$...$$`) LaTeX ifadelerini render eden `LatexRenderer` ortak bileşenini yaz.
- [x] **3.5: Chat UI Bileşeni**
  - [x] Chat penceresi tasarla (modern, karanlık mod uyumlu, animasyonlu).
  - [x] Karakter bazlı akış (streaming) desteğini ekle.
  - [x] Kod blokları için kopyalama ve syntax highlighting (örn: `prismjs` veya `react-syntax-highlighter`) desteği ekle.
- [x] **3.6: Yükleme (Skeleton Loaders) Efektleri**
  - [x] Yapay zekanın düşündüğü anlar için parlayan skeleton loaders ekle.

### ✅ KONTROL GÖREVİ (Phase 3):
- [x] Tarayıcıda `/learn` rotasına gidilebiliyor.
- [x] `LatexRenderer` bileşeni $\int x^2 dx = \frac{x^3}{3} + C$ gibi formülleri görsel olarak hatasız render ediyor.
- [x] Chat arayüzü responsive olarak çalışıyor.

---

## 🧠 PHASE 4: AI Backend & Akıllı Model Router (Vercel Functions / Backend API)
Gelen sorgunun türüne (matematiksel reasoning, kod yazma, basit sınıflandırma) göre en uygun modele (Gemini, DeepSeek, Claude) yönlendirilmesi ve API altyapısının kurulması.

- [x] **4.1: API Altyapısının Kurulması**
  - [x] Projenin backend katmanını (Vercel Serverless Functions - TypeScript) `/api/chat` uç noktasıyla yapılandır.
- [x] **4.2: DeepSeek V4 Entegrasyonu**
  - [x] Hızlı sınıflandırma, kavram haritası JSON çıktısı üretme ve ilk seviye analizler için DeepSeek API bağlantısını kur.
- [x] **4.3: Gemini 3.1 Pro Entegrasyonu**
  - [x] İleri düzey STEM akıl yürütme, matematik kanıtları ve fizik problemleri için Gemini Pro API entegrasyonunu yap.
- [x] **4.4: Claude Sonnet 4.6 Entegrasyonu**
  - [x] Yazılım mühendisliği, kod yazma ve sandbox yönlendirmeli sorular için Claude API entegrasyonunu yap.
- [x] **4.5: Dinamik Görev Yönlendirici (Router) Tasarımı**
  - [x] Gelen kullanıcı sorusunu analiz eden ve hangi modelin kullanılacağını seçen regex veya mini-sınıflandırıcı mekanizmayı yaz.
- [x] **4.6: Prompt Caching Yapılandırması**
  - [x] DeepSeek ve Claude için sohbet geçmişini API'ye gönderirken cache hit oranını artıracak şekilde yapılandır.
- [x] **4.7: Token ve Latency Günlüğü**
  - [x] Her API çağrısında harcanan token miktarını, yanıt süresini (ms) ve maliyeti veritabanındaki `messages` tablosuna logla.

### ✅ KONTROL GÖREVİ (Phase 4):
- [x] `/api/chat` endpoint'ine gönderilen "15. dereceden türev" sorusu Gemini'ye gidiyor.
- [x] "React buton bileşeni yaz" sorusu Claude'a gidiyor.
- [x] Yanıtlar token ve latency verileriyle birlikte veritabanına kaydediliyor.

---

## 🎓 PHASE 5: Sokratik Tutor (Eğitmen) Motoru
Kullanıcıya doğrudan cevap vermek yerine, onu doğru cevaba yönlendirecek ipucu döngüleri ve Sokratik diyalog yapısının kurulması.

- [x] **5.1: Sokratik Sistem Prompt Tasarımı**
  - [x] Yapay zekaya "kesinlikle direkt çözüm verme, ipucu ver, öğrenciyi düşünmeye sevk et" talimatlarını içeren detaylı sistem prompt'unu yaz. Temperature ayarını 0.3 gibi stabil bir değere çek.
- [x] **5.2: 3 Kademeli İpucu Sistemi**
  - [x] Hata durumunda modelin uygulayacağı akış:
    1. *Kademe (Genel İpucu):* Konseptin temel prensibini hatırlatma.
    2. *Kademe (Yönlendirici İpucu):* Formül veya yönteme odaklama.
    3. *Kademe (Nihai İpucu):* Neredeyse cevaba götüren spesifik soru.
- [x] **5.3: Kullanıcı Hakimiyet Kontrolü**
  - [x] Eğer kullanıcının o konudaki `mastery_score` değeri %90'ın üzerindeyse, Sokratik döngüyü atlayıp doğrudan cevabı doğrulayacak modüller kur.
- [x] **5.4: Öz-Açıklama (Self-Explanation) Soruları**
  - [x] Çözümün kritik aşamalarında yapay zekanın kullanıcıya "Peki neden burada eksi işareti kullandık? Açıklayabilir misin?" şeklinde sorular sormasını sağla.
- [x] **5.5: Sokratik Akış State Machine**
  - [x] Kullanıcının kaçıncı ipucunda olduğunu, ne kadar süredir takıldığını izleyen state yapısını kur.
- [x] **5.6: Yanıtın UI'a Aktarılması**
  - [x] Sokratik çıktıyı Markdown ve KaTeX formatlarında temiz şekilde ekranda göster.

### ✅ KONTROL GÖREVİ (Phase 5):
- [x] Kullanıcı integral sorusu sorduğunda AI doğrudan integralin sonucunu vermiyor, "Önce değişken değiştirme yöntemini düşündün mü?" gibi yönlendirmeler yapıyor.
- [x] 3 başarısız denemeden sonra nihai çözümün gösterilmesi opsiyonu aktif.

---

## 🗣 PHASE 6: Feynman Modu (Anlatarak Öğrenme) ve Hakem Ajanı
Kullanıcının bir konuyu kendi cümleleriyle anlatarak yapay zekaya sunduğu ve yapay zekanın bu anlatımı değerlendirdiği Feynman tekniği modülü.

- [x] **6.1: Feynman UI Tasarımı**
  - [x] Kullanıcının anlatacağı konuyu seçeceği ve serbest metin veya ses girdisiyle anlatacağı temiz bir arayüz oluştur.
- [x] **6.2: Hakem Prompt Tasarımı (Değerlendirici)**
  - [x] Hakem modelin (DeepSeek/Gemini), konunun mutlaka içermesi gereken anahtar kelimeleri ve kavram haritasını içeren gizli listeyle karşılaştırma yapmasını sağla.
- [x] **6.3: Eksik Terminoloji Tespiti ve Yönlendirme**
  - [x] Kullanıcının anlatımında eksik bıraktığı kısımları tespit edip, doğrudan "yanlış yaptın" demeden "Açıkladığın kısım harika, ancak entropi kavramı burada nasıl bir rol oynuyor?" gibi soru sorarak eksikliği tamamlattır.
- [x] **6.4: Mnemoteknik Önerici**
  - [x] Zor kavramların hafızada kalması için modelin akıllıca analojiler, kısaltmalar veya hikayeler (mnemoteknik) önermesini sağla.
- [x] **6.5: Feynman Skorlama ve Mastery Güncellemesi**
  - [x] Anlatım kalitesine göre (1-100 arası) Feynman skoru üret ve bunu `concept_mastery` tablosuna kanıt (evidence) olarak yaz.

### ✅ KONTROL GÖREVİ (Phase 6):
- [x] Feynman modunda "Hücre bölünmesi" konusu anlatıldığında, hakem ajan eksik olan "mitoz/mayoz farkı" kavramını fark edip kullanıcıya bununla ilgili soru yönlendiriyor.
- [x] Değerlendirme sonunda kazanılan skor kullanıcının profilindeki konsept hakimiyet seviyesine yansıyor.

---

## 🎯 PHASE 7: Hata Zekası (Mistake Intelligence) ve FSRS Sistemi
Kullanıcının yaptığı hataların sınıflandırılması, hata günlüğünün tutulması ve FSRS (Free Spaced Repetition Scheduler) algoritmasıyla akıllı tekrar kartlarının üretilmesi.

- [x] **7.1: Hata Tipi Sınıflandırıcı**
  - [x] Yapay zekanın, kullanıcının yaptığı hatayı şu 4 kategoriye ayırmasını sağla:
    - *Conceptual (Kavramsal Eksiklik)*
    - *Procedural (İşlemsel Hata)*
    - *Calculation (Hesaplama Hatası / Dikkat)*
    - *Strategic (Strateji / Yanlış Yöntem Seçimi)*
- [x] **7.2: `error_logs` Tablosuna Kayıt**
  - [x] Sınıflandırılan hata bilgisini, orijinal soruyu ve kullanıcının cevabını logla.
- [x] **7.3: FSRS Algoritmasının Kurulması**
  - [x] FSRS (SuperMemo alternatifi açık kaynaklı aralıklı tekrar algoritması) matematiksel formüllerini JS/TS fonksiyonları olarak yaz.
- [x] **7.4: Otomatik Tekrar Kartı (Flashcard) Üretimi**
  - [x] Hata yapılan konsept ile ilgili arka planda otomatik olarak soru-cevap formatında flashcard üret ve `sr_cards` tablosuna kaydet.
- [x] **7.5: Framer Motion Flashcard UI**
  - [x] Kartların üzerine tıklandığında 3D dönme efekti (flip card) ile cevabı gösteren animasyonlu UI bileşeni tasarla.
- [x] **7.6: Derecelendirme Butonları**
  - [x] Kartın altında "Tekrar", "Zor", "İyi", "Kolay" butonlarını yerleştir. Seçime göre FSRS interval (tekrar süresi) hesabını yap.
- [x] **7.7: PLAN.EX Takvimi Entegrasyonu**
  - [x] FSRS algoritmasının belirlediği bir sonraki tekrar gününü (due_at) otomatik olarak PLAN.EX takvimine bir "Tekrar Görevi" event'i olarak ekle.

### ✅ KONTROL GÖREVİ (Phase 7):
- [x] Bir matematik probleminde yapılan işlem hatası `Calculation` olarak etiketlenip veritabanına yazılıyor.
- [x] Otomatik üretilen kart "Zor" olarak işaretlendiğinde, FSRS algoritması yeni tarihi hesaplıyor ve PLAN.EX takviminde o güne görev ekleniyor.

---

## 📊 PHASE 8: Konu Hakimiyet (Concept Mastery) Dashboard'u
Kullanıcının hangi konularda ne kadar yetkin olduğunu gösteren, metakognitif kalibrasyon grafikleri barındıran kontrol paneli.

- [x] **8.1: Mastery Puanlama Algoritması**
  - [x] Bir konseptin mastery skorunun artması için en az 3 bağımsız kanıt (Sokratik çözümlü soru, başarılı Feynman anlatımı, FSRS kart doğru cevabı) şartını kodla.
- [x] **8.2: Konu Ağacı (Knowledge Graph) Görselleştirmesi**
  - [x] Konuların önkoşul ilişkilerini (örn: Türev bilmeden İntegral çözemezsin) gösteren etkileşimli bir ağaç grafiği oluştur.
- [x] **8.3: Metakognitif Kalibrasyon Grafiği**
  - [x] Kullanıcının soru çözmeden önceki "Bu konuda ne kadar iyiyim?" tahmini (1-5 arası) ile gerçek performansını karşılaştıran saçılım grafiği (scatter plot) tasarla.
- [x] **8.4: Hata Kümesi Analizi (Error Cluster)**
  - [x] En çok hangi hata tipinin (örn: %60 Dikkat Hatası) yapıldığını pasta grafiği ile göster.
- [x] **8.5: Zayıf Konu Uyarıları**
  - [x] Belirli bir eşiğin altındaki konuları "Acil Tekrar Edilmesi Gerekenler" olarak panelin en üstünde listele.

### ✅ KONTROL GÖREVİ (Phase 8):
- [x] Dashboard üzerindeki önkoşul ağacında tamamlanan konular yeşil, eksikler kırmızı, kilitli olanlar ise pasif olarak görünüyor.
- [x] Metakognitif kalibrasyon ekranı tahmin ve gerçek skor farkını net şekilde hesaplıyor.

---

## 🗺 PHASE 9: Görselleştirme Modu (Mapping Mode) — AI Mindmap & Excalidraw Entegrasyonu
Karmaşık STEM konularının görsel şemalara ve akış şemalarına dönüştürülmesi, beyaz tahta üzerinde çalışma desteği.

- [x] **9.1: React Flow Altyapısı**
  - [x] `reactflow` paketini kur ve `/learn/map` rotasında boş bir tuval (canvas) oluştur.
- [x] **9.2: AI Yapılandırılmış JSON → Mindmap Dönüşümü**
  - [x] Yapay zekanın ürettiği hiyerarşik JSON verisini alıp otomatik konumlandırılmış (auto-layout) React Flow düğümlerine (nodes) ve bağlantılarına (edges) çevir.
- [x] **9.3: PDF'den Mindmap Üretimi**
  - [x] Kullanıcının yüklediği bir ders notundan veya kitaptan saniyeler içinde konu başlıklarını çıkaran ve haritalandıran backend akışını yaz.
- [x] **9.4: "Bu Dalı Genişlet" Özelliği**
  - [x] Haritadaki bir düğüme tıklandığında, o düğümün detaylarını RAG veritabanından çekip yeni alt düğümler olarak ekleyen tetikleyiciyi kur.
- [x] **9.5: Excalidraw Entegrasyonu**
  - [x] `@excalidraw/excalidraw` bileşenini uygulamaya dahil et. Kullanıcının zihin haritası üzerinde serbest çizim yapabilmesini sağla.
- [x] **9.6: Dışa Aktarma (Export)**
  - [x] Hazırlanan haritaların PNG, PDF ve Markdown formatlarında indirilmesini sağla.

### ✅ KONTROL GÖREVİ (Phase 9):
- [x] Bir konu adı girildiğinde AI 3 seviyeli bir zihin haritasını anında ekrana çiziyor.
- [x] Haritadaki bir node'a tıklayıp Excalidraw tuvalinde yanına not alınabiliyor ve bu çalışma kaydedilebiliyor.

---

## 🗄 PHASE 10: RAG Doküman İngestion (Vektör Veri Tabanı ve Arama)
Kullanıcının kendi PDF ders notlarını sisteme yüklemesi, bunların vektörlere bölünmesi ve yapay zekanın sadece bu kaynaklara dayanarak yanıt vermesi.

- [x] **10.1: Doküman Yükleme Arayüzü**
  - [x] Drag & drop destekli, PDF ve TXT formatlarını kabul eden yükleme arayüzü yaz. Dosyaları Supabase Storage'a kaydet.
- [x] **10.2: Tümevarımsal Chunking (Bölümleme)**
  - [x] PDF'leri düz metin olarak bölmek yerine; teorem, formül, tanım ve örnek soru sınırlarını koruyan akıllı chunking fonksiyonunu yaz (ortalama chunk boyutu: 300-500 token).
- [x] **10.3: Embedding (Vektör) Üretimi**
  - [x] Oluşturulan chunk'ları `text-embedding-3-small` (OpenAI) veya ücretsiz bir HuggingFace embedding servisi API'si üzerinden vektörlere çevir.
- [x] **10.4: pgvector Kayıt ve Metadata**
  - [x] Vektörleri `document_chunks` tablosuna `concept_tags`, `source_page` ve `difficulty` etiketleriyle birlikte yaz.
- [x] **10.5: Hata İndeksi Eşleştirmesi**
  - [x] Kullanıcının daha önce hata yaptığı konuları, dokümandaki ilgili sayfalarla eşleştirerek meta verilere ekle.
- [x] **10.6: Vektör Arama ve Context Enjeksiyonu**
  - [x] Sokratik Tutor bir soruya yanıt verirken kullanıcının dokümanlarında benzerlik araması yapıp (cosine similarity) bulduğu parçaları prompt'a eklesin.
- [x] **10.7: Halüsinasyon Önleme Politikası**
  - [x] Eğer aranılan konu dokümanlarda bulunamazsa AI'ın dışarıdan bilgi uydurmak yerine "Bu bilgi kaynaklarınızda bulunamadı" demesini sağla.

### ✅ KONTROL GÖREVİ (Phase 10):
- [x] 20 sayfalık bir Fizik PDF'i yükleniyor, arka planda vektörlere bölünerek Supabase'e yazılıyor.
- [x] PDF içeriğiyle ilgili spesifik bir soru sorulduğunda AI, sayfa numarası referansıyla cevap veriyor.

---

## 📷 PHASE 11: OCR Hattı ve Multimodal Giriş
El yazısı matematiksel denklemlerin, formüllerin ve grafiklerin kamera/görsel yoluyla sisteme aktarılıp çözümlenmesi.

- [x] **11.1: Görsel Yükleme ve Kırpma UI**
  - [x] Kamera erişimi, sürükle-bırak ve ekran görüntüsü yapıştırma (clipboard paste) destekli görsel yükleme alanı oluştur.
- [x] **11.2: Görsel Ön İşleme**
  - [x] Parlaklık, kontrast ve gürültü azaltma filtreleriyle el yazısı görsellerin okunabilirliğini artır.
- [x] **11.3: Gemini Flash OCR Entegrasyonu**
  - [x] Yüklenen görseli Gemini 3 Flash modeline göndererek içerikteki metinleri ve LaTeX formüllerini tespit etmesini sağla.
- [x] **11.4: Formül İyileştirme Çift Turu**
  - [x] OCR çıktısında karmaşık sembollerin hata oranını düşürmek için regex tabanlı bir düzeltici yaz veya Mathpix API fallback mekanizması kur.
- [x] **11.5: Kullanıcı Doğrulama Ekranı**
  - [x] AI'ın görselden çıkardığı formülü kullanıcıya gösterip "Doğru okundu mu? Gerekirse düzeltin" düzenleme alanı sun.
- [x] **11.6: Çözücüye/Haritaya Yönlendirme**
  - [x] Onaylanan formülü doğrudan Sokratik Tutor'a veya Zihin Haritası oluşturucuya girdi olarak gönder.

### ✅ KONTROL GÖREVİ (Phase 11):
- [x] Kağıda yazılmış $\lim_{x \to 0} \frac{\sin(x)}{x}$ integral/limit görseli yüklendiğinde, OCR bunu kusursuz LaTeX formatına çeviriyor.
- [x] Dönüşen LaTeX formülü Sokratik Tutor sohbetine girdi olarak aktarılabiliyor.

---

## 💻 PHASE 12: CS ve Algoritma Sandbox'ı
Bilgisayar bilimi ve algoritma soruları için güvenli, tarayıcı içi kod çalıştırma ve adım adım görsel hata ayıklama (debug) alanı.

- [ ] **12.1: Tarayıcı İçi Kod Çalıştırma (WebContainers veya Iframe)**
  - [ ] JavaScript, Python ve C++ kodlarını tarayıcı üzerinde güvenli çalıştıracak altyapıyı (örn: Judge0 API veya yerel WASM tabanlı sandbox) kur.
- [ ] **12.2: Kod Editörü UI**
  - [ ] Monaco Editor veya CodeMirror kullanarak satır numaralı, syntax highlight destekli bir kod editörü entegre et.
- [ ] **12.3: Sokratik Debugger Promptu**
  - [ ] Kod hata verdiğinde AI'ın doğrudan çalışan kodu vermesi yerine, "Hata 5. satırdaki index aralığından kaynaklanıyor olabilir mi? Orayı kontrol et" şeklinde yönlendirme yapmasını sağla.
- [ ] **12.4: Zaman/Alan Karmaşıklığı (Big-O) Analizörü**
  - [ ] Yazılan kodun Big-O karmaşıklığını grafiksel olarak gösteren ve optimize edilmiş alternatiflerini (sadece kullanıcı talep ederse) sunan modülü yaz.
- [ ] **12.5: Değişken Durum Görselleştirici (State Trace)**
  - [ ] Döngülerin her adımında değişkenlerin aldığı değerleri tablo veya grafik halinde gösteren animasyonlu panel yap.

### ✅ KONTROL GÖREVİ (Phase 12):
- [ ] Sandbox editöründe yazılan Python kodu çalıştırılıp çıktısı terminal ekranında görünüyor.
- [ ] Hatalı kod yazıldığında Sokratik asistan hatanın nedenini ipuçlarıyla anlatıyor.

---

## 📝 PHASE 13: Akıllı Sınav Üretici ve Aralıklı Pratik (Interleaved Practice)
Kullanıcının zayıf yönlerine odaklanan, farklı zorluk derecelerinde ve türlerde deneme sınavları oluşturan motor.

- [ ] **13.1: Interleaved (Karışık) Soru Seçim Algoritması**
  - [ ] Tek bir konudan ardışık soru sormak yerine (blocking), öğrenmeyi kalıcı kılan karışık konulu soru setleri hazırlayan seçici algoritmayı yaz.
- [ ] **13.2: Zorluk Derecesi Kalibrasyonu**
  - [ ] Kullanıcının anlık mastery skoruna göre soruların zorluğunu dinamik olarak ayarla (ne çok kolay ne çok zor - optimal zorluk bölgesi).
- [ ] **13.3: Çeşitlendirilmiş Soru Tipleri**
  - [ ] Çoktan seçmeli, açık uçlu Sokratik sorgulama ve kod tamamlama soru formatlarını destekleyen şablonlar tasarla.
- [ ] **13.4: Exam Wrapper (Sınav Öncesi ve Sonrası Metakognisyon)**
  - [ ] Sınavdan önce kullanıcıya "Bu sınavdan kaç almayı bekliyorsun?", sınavdan sonra ise "Sence hangi konularda hata yaptın?" sorularını sorarak metakognitif farkındalığı ölç.
- [ ] **13.5: Otomatik Değerlendirme Raporu**
  - [ ] Sınav bitiminde zayıf kalınan noktaları listeleyen ve doğrudan FSRS tekrar sırasına alan bitiş raporu ekranı yap.

### ✅ KONTROL GÖREVİ (Phase 13):
- [ ] Sınav üretici 5 soruluk bir set hazırladığında soruların 3'ü kullanıcının en zayıf olduğu konulardan, 2'si ise diğer konulardan seçiliyor.
- [ ] Exam wrapper verileri `tutor_events` tablosuna başarıyla yazılıyor.

---

## ⚡ PHASE 14: INCUP (ADHD) Adaptasyonları ve UX Ayrıntıları
ADHD ve dikkat dağınıklığı yaşayan kullanıcılar için odaklanmayı kolaylaştıran, aciliyet ve oyunlaştırma içeren arayüz geliştirmeleri (TECHNICS Dokümanı Esaslı).

- [ ] **14.1: Odak Köprüsü (Focus Bridge)**
  - [ ] Çalışma sayfalarına entegre, arkada çalabilen Beyaz Gürültü (White Noise), Kahverengi Gürültü (Brown Noise) ve Lo-Fi müzik çalar yerleştir.
- [ ] **14.2: Aciliyet Modu (Urgency Timer)**
  - [ ] Belirli görevler veya mini-testler için görsel olarak geri sayan, stres yaratmayan ama odaklanmayı tetikleyen bar tipi zamanlayıcılar ekle.
- [ ] **14.3: Vücut İkizliği (Body Doubling)**
  - [ ] Arayüzde sanal bir çalışma partnerinin (AI asistan maskotu veya animasyonlu avatar) yan tarafta sessizce ders çalıştığı hissini veren mikro animasyon ekle.
- [ ] **14.4: Enerji Yönetimi Ayarı**
  - [ ] Kullanıcının gün içindeki en yüksek enerji saatlerini (örn: 10:00 - 12:00) kaydettiği ve PLAN.EX'in zorlu STEM konularını otomatik olarak bu saatlere planladığı entegrasyonu yaz.
- [ ] **14.5: If-Then Plan Oluşturucu**
  - [ ] Kullanıcı bir engelle karşılaştığında ne yapacağını önceden planladığı dinamik form: "Eğer *dikkatim dağılırsa*, *5 dakika esneme hareketi yapacağım*." Bunu hatırlatıcı olarak ekranda göster.

### ✅ KONTROL GÖREVİ (Phase 14):
- [ ] Kullanıcı "Odaklanamıyorum" butonuna bastığında if-then planı tetikleniyor ve arka planda kahverengi gürültü çalmaya başlıyor.
- [ ] Zamanlayıcı barı görsel olarak azalarak dikkati ekranda tutuyor.

---

## 📈 PHASE 15: Performans Optimizasyonu, Prompt Caching ve Maliyet Yönetimi
Yüksek LLM maliyetlerini düşürmek, ağ gecikmesini (latency) azaltmak ve tarayıcı performansını en üst düzeye çıkarmak için optimizasyonlar.

- [ ] **15.1: Prompt Caching Optimizasyonu**
  - [ ] API istek şablonlarını sabitle. Değişken verileri (kullanıcı mesajı gibi) prompt'un en sonuna koyarak DeepSeek ve Claude tarafında maksimum cache hit elde et.
- [ ] **15.2: Akıllı Sohbet Budama (Context Pruning)**
  - [ ] 20 mesajı geçen sohbetlerde eski mesajları özetleyerek tek bir sistem mesajına sıkıştır ve bağlam penceresini (context window) küçük tut.
- [ ] **15.3: Maliyet Dashboard'u (Yönetici Görünümü)**
  - [ ] Hangi kullanıcının ne kadar token tükettiğini ve hangi modelin ne kadar maliyete sebep olduğunu gösteren grafik paneli oluştur.
- [ ] **15.4: Kullanıcı Görünür Token Sayacı**
  - [ ] Kullanıcı arayüzünde kalan günlük soru limitini veya harcanan enerjiyi şeffaf şekilde gösteren bar ekle.
- [ ] **15.5: Code Splitting ve Lazy Loading**
  - [ ] `/learn` altındaki büyük kütüphaneleri (Excalidraw, React Flow, Monaco Editor) dynamic imports kullanarak sadece ilgili sayfaya girildiğinde yüklet.

### ✅ KONTROL GÖREVİ (Phase 15):
- [ ] Arka arkaya atılan Sokratik sohbet mesajlarında prompt token maliyetinin caching sayesinde düştüğü konsol/db kayıtlarında doğrulanıyor.
- [ ] Sayfa ilk açılış boyutu (bundle size) lazy loading sayesinde optimize edildi.

---

## 🚀 PHASE 16: Güvenlik, Test ve Production Deployment
Tüm sistemin güvenlik denetimlerinin yapılması, testlerin yazılması ve projenin canlı ortama (Vercel & Supabase Production) taşınması.

- [ ] **16.1: RLS Güvenlik Denetimi (Audit)**
  - [ ] Supabase üzerindeki tüm tabloların politikalarını test et. Anonim kullanıcıların hiçbir veriye yazamadığından emin ol.
- [ ] **16.2: API Hız Sınırlama (Rate Limiting)**
  - [ ] API uç noktalarına kullanıcı IP'si veya ID'si bazlı limitler koy (örn: Dakikada en fazla 10 istek).
- [ ] **16.3: Sandbox Güvenlik Kontrolleri**
  - [ ] Sandbox içinde sonsuz döngülerin ve bellek sızıntılarının engellendiğinden emin ol (timeout ve kaynak kısıtları).
- [ ] **16.4: Vitest Unit Testleri**
  - [ ] FSRS algoritması, Sokratik ipucu yönlendirici mantığı ve RAG cosine similarity fonksiyonları için unit testleri yaz.
- [ ] **16.5: Playwright E2E Testleri**
  - [ ] Kullanıcı girişi -> Ders Detayı -> Sokratik Sohbet Başlatma -> Hata Yapma -> FSRS Kartının Oluşması -> Takvime Eklenme akışını kapsayan uçtan uca testi yaz.
- [ ] **16.6: Production Ortamının Hazırlanması**
  - [ ] Vercel üzerinde production projesi oluştur. Canlı Supabase URL ve KEY bilgilerini gir.
  - [ ] `vercel.json` dosyasında CSP (Content Security Policy) ayarlarını güncelleyerek sadece izin verilen AI domainlerine istek atılmasını sağla.
- [ ] **16.7: Deployment ve Smoke Test**
  - [ ] Projeyi canlıya deploy et ve tüm akışların canlı ortamda çalıştığını manuel olarak doğrula.

### ✅ KONTROL GÖREVİ (Phase 16):
- [ ] Playwright E2E testleri hatasız tamamlanıyor.
- [ ] Canlı ortamda Supabase RLS ve OAuth akışları eksiksiz çalışıyor.
- [ ] Uygulama canlı URL üzerinden başarıyla erişilebilir durumda.

---

## 🔌 PHASE 17: LLM Provider Abstraction & DeepSeek Entegrasyonu
Tüm model çağrılarının tek bir soyutlama katmanı üzerinden yönetilmesi, DeepSeek V4 entegrasyonu ve maliyet/token loglamasının yapılması.

- [x] **17.1: Tüm API Çağrılarının Tek Bir `llmClient.ts` Katmanına Çekilmesi**
  - [x] `api/lib/llmClient.ts` ve `api/lib/config.ts` oluşturuldu.
  - [x] Claude, DeepSeek ve OpenAI modellerinin birbirinin yerine takılabileceği modüler bir LLM istemci yapısı oluştur.
  - [x] `api/chat.ts`, `api/feynman.ts`, `api/mindmap.ts`, `api/ocr.ts` tüm model çağrıları `llmClient.ts` üzerinden yapılacak şekilde refactor edildi.
- [x] **17.2: DeepSeek V4 Entegrasyonu ve Akıl Yürütme (Reasoning) Modu**
  - [x] DeepSeek V4 API bağlantısı OpenRouter üzerinden kuruldu.
  - [x] Feynman analizi ve derin kavramsal sorgular için DeepSeek V4'ün reasoning/thinking özelliklerini devreye al (`config.ts` feynman task tipinde `reasoning: true`).
- [x] **17.3: Model Bazlı Maliyet ve Token Loglama**
  - [x] Her istek sonrasında tüketilen girdi/çıktı token sayılarını ve hesaplanan maliyetleri `messages` tablosuna kaydet (`callLLM`/`streamLLM` çıktılarında `promptTokens`, `completionTokens`, `cost` alanları).
- [x] **17.4: Görev Türüne Göre Model ve Parametre Konfigürasyonu**
  - [x] Sokratik yönlendirme akışı için `temperature: 0.3` konfigürasyonu uygulandı (`TASK_CONFIG.socratic`).
  - [x] Feynman anlatım değerlendirmesi için `responseFormat: 'json_object'` ile JSON çıktı garantilendi.

### ✅ KONTROL GÖREVİ (Phase 17):
- [x] Model çağrıları tek bir istemci (`api/lib/llmClient.ts`) üzerinden yönetiliyor, model değiştirmek `config.ts` güncellenerek yapılıyor, kod genelinde refactor gerektirmiyor.
- [x] DeepSeek V4 entegrasyonu çalışıyor; tüm modeller OpenRouter üzerinden `deepseek/deepseek-v4-flash` ile çağrılıyor.
- [x] Gönderilen her isteğin token kullanımı ve maliyeti `callLLM`/`streamLLM` çıktısında alınıp veritabanına loglanabiliyor.

---

## 👤 PHASE 18: Gelişmiş Onboarding & Hazır Müfredat Kavram Ağaçları
Öğrencinin profilini sisteme entegre eden akışların kurulması ve hazır akademik kavram ağaçlarının eklenmesi.

- [ ] **18.1: Kişiselleştirilmiş Onboarding Akışı**
  - [ ] Kullanıcının okuduğu bölümü, akademik hedeflerini, mevcut bilgi seviyesini ve tercih ettiği öğrenme stilini toplayan onboarding arayüzünü oluştur.
- [ ] **18.2: Profil Verilerini Sistem Promptuna Enjekte Eden `buildSystemPrompt()` Fonksiyonu**
  - [ ] Onboarding'de toplanan kullanıcı profili ve tercih verilerini dinamik olarak sistem promptlarına enjekte eden fonksiyonu geliştir.
- [ ] **18.3: Pre-loaded Müfredat Kavram Ağaçları**
  - [ ] Türk üniversite müfredatlarına uyumlu hazır Elektrik-Elektronik Mühendisliği (EEE), Matematik ve Fizik kavram ağaçlarını (Concept Tree) sisteme önceden yükle.

### ✅ KONTROL GÖREVİ (Phase 18):
- [ ] Yeni bir kullanıcı kaydolduğunda onboarding ekranında bölüm ve öğrenme stili tercihleri alınabiliyor.
- [ ] AI asistanı, kullanıcının seviyesine göre (örn: 1. sınıf mühendislik öğrencisi) analojilerini ve dilini dinamik olarak ayarlıyor.
- [ ] Hazır kavram ağaçları veritabanında seed ediliyor ve Dashboard/Workbench üzerinde görüntülenebiliyor.

---

## 📱 PHASE 19: Mobil Uyumluluk & PWA (Çevrimdışı Çalışma)
Workspace'in mobil cihazlara uyarlanması ve çevrimdışı çalışma desteği için PWA entegrasyonu.

- [ ] **19.1: `/learn` Workspace Mobil Uyumlaştırması (Responsive Design)**
  - [ ] Sol taraftaki sohbet alanı ile sağ taraftaki Workbench panelini mobil ekran boyutlarına göre katlanabilir veya sekme geçişli hale getir.
- [ ] **19.2: PWA Manifest ve Service Worker Entegrasyonu**
  - [ ] Uygulamayı kurulabilir bir PWA haline getirmek için manifest dosyasını ve service worker yapısını kur.
  - [ ] İnternet bağlantısı olmadığında dahi FSRS flashcard kartlarının yerel IndexedDB cache (Dexie) üzerinden çalışabilmesini sağla.

### ✅ KONTROL GÖREVİ (Phase 19):
- [ ] `/learn` sayfası mobil cihazlarda kayma olmadan, sohbet ve workbench sekmeleri arasında akıcı geçişlerle kullanılabiliyor.
- [ ] Uygulama telefona/masaüstüne PWA olarak kurulabiliyor.
- [ ] Çevrimdışı modda flashcard seansı başlatılabiliyor ve yapılan puanlamalar internet geldiğinde senkronize edilmek üzere yerelde saklanıyor.
