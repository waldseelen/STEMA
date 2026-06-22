# PROGRESS.md — STEMA + PLAN.EX Entegrasyon İlerleme Günlüğü

**Tarih:** 2026-06-19  
**Referans:** [TASKS.md](file:///C:/Users/HP/DEV/STEMA/TASKS.md), [ARCHITECTURE.md](file:///C:/Users/HP/DEV/STEMA/ARCHITECTURE.md)

---

## 1. Proje Hikayesi: Nasıl Başladı, Ne Yapıyor, Nereye Gidiyor?

### 🎬 Nasıl Başladı?
Proje, öğrencilerin ve profesyonellerin derslerini, kişisel görevlerini, alışkanlıklarını ve zaman takibini tek bir yerden yönetebilecekleri **PLAN.EX** adında bir kişisel verimlilik ve planlayıcı uygulaması olarak başladı. 
* **İlk Altyapı:** Yerel veri depolaması için tarayıcıda çalışan **Dexie (IndexedDB)** ile sunucu tarafında **Firebase** entegrasyonu üzerine kurulmuş hibrit bir yapıya sahipti. 
* **Değişim İhtiyacı:** Firebase'in getirdiği karmaşıklıklar, ilişkisel sorgu kısıtlamaları ve veri şemalarının sürdürülebilirliği göz önüne alınarak Firebase sistemden tamamen elendi. Yeni veri modeli, güvenlik kuralları ve güçlü ilişkisel altyapı için **Supabase** ana veri tabanı olarak seçildi.

### 🧠 STEMA Entegrasyonu Nedir ve Ne Yapıyor?
PLAN.EX'in üzerine, yapay zeka destekli, bilişsel ve metakognitif ölçümlere dayalı bir STEM öğrenme platformu olan **STEMA (Sokratik STEM Öğrenme Platformu)** modülü entegre edildi. 
STEMA, öğrencilere sadece çözümler sunan klasik bir sohbet arayüzü değildir; 
1. **Sokratik Eğitmen Modu:** Öğrenciye doğrudan cevap vermek yerine, onu 3 kademeli ipuçlarıyla yönlendiren ve öz-açıklama sorularıyla düşünmeye sevk eden interaktif bir öğretmen ajanı.
2. **Feynman Hakemi Modu:** Öğrencinin bir STEM konusunu kendi cümleleriyle basitleştirerek anlatmasını isteyen, bu anlatımı değerlendirip kavramsal boşlukları ve eksik terminolojiyi belirleyen, akılda kalıcı mnemoteknik benzetmeler üreten hakem ajan.
3. **Hata Zekası (Mistake Intelligence):** Öğrencinin yaptığı hataları sınıflandıran (Kavramsal, İşlemsel, Dikkat, Stratejik) ve hata günlüğü oluşturan zeka katmanı.
4. **FSRS Aralıklı Tekrar Sistemi:** Hata yapılan konularda otomatik flashcard üretip, SuperMemo tabanlı FSRS algoritmasıyla akıllı çalışma takvimi oluşturan mekanizma.
5. **Dinamik Beyaz Tahta & Ajan Grafikleri:** Sözel veya matematiksel anlatımı görselleştirmek üzere, yapay zekanın sohbet akışından gönderdiği çizim ve matematiksel grafik çizim komutlarını (`[WHITEBOARD_DRAW: {...}]`) anlık olarak işleyen vektörel beyaz tahta motoru.

### 🚀 Nereye Gidiyor?
Proje, klasik bir görev/zaman yöneticisinden **akıllı bir STEM çalışma arkadaşına** evriliyor. Sonraki hedeflerde:
* **RAG Entegrasyonu:** Yüklenen ders notlarının ve PDF dökümanlarının backend üzerinde parçalanıp vektörel embeddings (`pgvector`) haline getirilmesi ve chat akışında doğrudan kaynak gösterilerek kullanılması.
* **React Flow ile Konu Haritası (Knowledge Graph):** Önkoşul ve kazanım ağaçlarının görselleştirilerek öğrencinin zayıf ve güçlü konularını interaktif bir zihin haritasında görmesi.
* **Sandbox Entegrasyonu:** Kod yazma ve yazılım geliştirme konularında güvenli kod çalıştırma ortamlarının eklenmesi.

---

## 2. Neler Yaptık? (Mevcut Durum ve Tamamlanan Fazlar)

### 🏗 1. Firebase Temizliği & Supabase Temelleri (Phase 0 & Phase 1)
* **Firebase Tamamen Elendi:** `plannerRepo`, `trackerRepo`, `settingsStore` ve `authStore` içindeki tüm Firebase bağımlılıkları temizlendi.
* **Supabase Kurulumu:** Supabase Client yapılandırıldı, `.env.local` entegrasyonu tamamlandı.
* **18 Tablolu SQL Şeması ve RLS:** Kullanıcı profilleri, dersler, görevler, alışkanlıklar, oturumlar, FSRS kartları, dokümanlar, hata günlükleri ve metakognitif izleme için `tutor_events` gibi 18 tablo oluşturuldu. Row-Level Security (RLS) politikaları en katı kurallarla yazıldı ve test edildi.

### 🔄 2. Veri Katmanı Dönüşümü (IndexedDB'den Supabase-First'e)
* **CRUD Katmanı Değişimi:** Planner ve Tracker modüllerinin tamamı yerel Dexie yazımından vazgeçip, merkezi `plannerRepo.ts` ve `trackerRepo.ts` üzerinden doğrudan Supabase API'lerine bağlandı.
* **Reaktif Sorgu Sistemi:** Dexie'nin `useLiveQuery` yapısı yerine, pub/sub tabanlı veri güncelleme ve cache geçersizleştirme (`queryInvalidation.ts`) mekanizmasıyla entegre çalışan `useSupabaseQuery` hook'u geliştirildi.
* **Dexie'nin Rolü:** Dexie artık primary CRUD kaynağı değildir; yalnızca çevrimdışı önbellekleme, yerel veri kurtarma ve cloud hydration işlemleri için bir cache/bridge olarak korundu.

### 🎓 3. Sokratik Motor ve Feynman Değerlendirme Sistemi (Phase 5 & Phase 6)
* **Sokratik Eğitmen:** `api/chat.ts` altında Sokratik diyalog promptları kurgulandı. Öğrenci hakimiyeti %90'ın üzerindeyse doğrudan doğrulama yapan, altındaysa 3 kademeli ipucu ve öz-açıklama diyaloglarını tetikleyen mantık kuruldu.
* **Feynman Modeli:** `api/feynman.ts` altında hakem ajanı yazıldı. Öğrenci metnini analiz edip JSON formatında puan, eksik kavram etiketleri ve mnemoteknik kartları dönen API endpoint'i bağlandı.
* **Metakognitif Telemetri:** Öğrencinin düşünme süreleri, takıldığı ipucu seviyeleri ve oturum başlatma olayları `tutor_events` tablosuna loglanacak şekilde kurgulandı.
* **LatexRenderer:** Harici bağımlılıkları minimize eden, satır içi (`$...$`) ve blok (`$$...$$`) KaTeX matematik sembollerini, listeleri ve markdown formatlarını güvenle işleyen özel bir parser yazıldı ve test edildi.

### 🎨 4. Tasarım Yenilemesi ve Arayüz Konsolidasyonu (Phase 7-8 ve Tasarım Dili)
* **Linear & Notion Estetiği:** Neon parlamalar, aşırı emojiler ve renkli gölgeler tamamen elendi. PLAN.EX tasarım diliyle uyumlu, grayscale border'lar, düz arka planlar (`var(--bg-surface-100)`), Lucide ikonları kullanan premium, sade ve minimalist bir stil uygulandı.
* **Birleşik Çalışma Alanı (`/learn`):** Ayrı sayfalar halinde dağılmış olan sohbet, feynman referee, flashcard'lar ve çizim araçları `/learn` altında tek bir Workspace (`LearnChat.tsx`) içinde toplandı. Sol tarafta birleşik AI Sohbeti, sağ tarafta ise aşağıdaki araçları içeren interaktif Workbench konumlandırıldı:
  * **Dinamik Beyaz Tahta (`Whiteboard.tsx`):** Manuel kalem ve geometrik şekil (çizgi, daire, dikdörtgen) çizimlerinin yanı sıra, yapay zekanın sohbet akışından gönderdiği çizim komutlarını (örneğin $\sin(x)$ grafiği, $x^2$ eğrisi, koordinat eksenleri, vektör okları) canvas üzerinde otomatik çizip etiketleyen çizim ajanı entegre edildi. "Sohbete Ekle" butonu ile çizim ekran görüntüsü sohbete ek dosya olarak eklenebilmektedir.
  * **FSRS Kart Çalışması:** Vakti gelen `sr_cards` flashcard'ları için "Tekrar", "Zor", "İyi", "Kolay" butonları ile akıllı FSRS güncellemesi Workbench sekmesinde çalışmaktadır.
  * **Döküman Kütüphanesi (RAG):** Kullanıcının yüklediği döküman ve notlar doğrudan Supabase `documents` tablosuna yazılır ve listede gösterilir.
  * **Kavram Hakimiyeti Ağacı:** Supabase `concepts` ve `concept_mastery` tablolarını reaktif olarak okuyup öğrencinin mevcut kazanım skorlarını listeler.
* **Gereksiz Dosya Temizliği:** Ayrı sayfalar halinde bulunan ancak artık tüm mantığı `/learn` içinde toplanan `LearnDashboard.tsx`, `LearnFeynman.tsx` ve `LearnFlashcards.tsx` dosyaları silindi; `routeModules.ts` ve `App.tsx` üzerindeki gereksiz lazy import'ları temizlendi.

### 🔌 5. LLM Provider Abstraction (Phase 17) — 2026-06-19
* **`api/lib/llmClient.ts` (yeni):** Tüm OpenAI-uyumlu API çağrılarını (OpenRouter üzerinden) yöneten merkezi katman.
  * `callLLM()` — non-streaming tamamlama; prompt/completion token sayısı, maliyet ($) ve gecikme (ms) döner.
  * `streamLLM()` — SSE akışlı tamamlama; `onToken`, `onComplete`, `onError` callback'leri ile stream yönetimi.
  * `callLLMWithMultimodal()` — OCR gibi görsel+metin girdisi gerektiren multimodal çağrılar için yardımcı fonksiyon.
  * Tüm hatalar merkezi olarak yakalanır ve anlamlı hata mesajlarına dönüştürülür.
* **`api/lib/config.ts` (yeni):** Model konfigürasyon ve yönlendirme katmanı.
  * `TASK_CONFIG` — Her task tipi (socratic, feynman, mindmap, ocr, flashcard) için model adı, temperature, `response_format`, `maxTokens` preset'leri.
  * `MODEL_PRICING` — OpenRouter üzerindeki modellerin input/output token fiyatları ($/M token).
  * `calculateCost()` — Token sayısına göre maliyet hesaplama.
  * Model değişikliği artık tek bir yerde (`config.ts`) yapılıyor, tüm API'ler otomatik etkileniyor.
* **Refactor edilen dosyalar:**
  * `api/chat.ts` — 4 farklı direkt API çağrısı (OpenRouter, Gemini, Claude, DeepSeek) tek bir `streamLLM()` çağrısına indirgendi. `PRICING` sabiti kaldırıldı, `calculateCost()` kullanılıyor. `generateAndSaveSRCard()` içindeki raw fetch `callLLM()` ile değiştirildi.
  * `api/feynman.ts` — OpenRouter + Gemini dual-path `callLLM()` ile değiştirildi. Mock fallback korundu.
  * `api/mindmap.ts` — OpenRouter + Gemini dual-path kaldırıldı; `callLLM()` ile taskType 'mindmap'/'mindmap-expand' kullanılıyor.
  * `api/ocr.ts` — Raw OpenRouter multimodal fetch, `callLLMWithMultimodal()` ile değiştirildi.
* **Kontrol:**
  * `npm run typecheck` — ✅ hatasız.
  * TASKS.md Phase 17.1–17.4 ve kontrol görevi işaretlendi.

---

## 3. Durum Özeti ve Tablosu

| Alan | Durum | Faz / Ref | Açıklama |
| --- | --- | --- | --- |
| **Firebase Temizliği** | ✅ Tamamlandı | Phase 0 | Kalan tüm referanslar ve kütüphane bağımlılıkları silindi. |
| **Supabase Şeması & RLS** | ✅ Tamamlandı | Phase 1 / ARCH-2 | 18 tablo, pgvector desteği ve user_id tabanlı strict RLS kuralları aktif. |
| **Veri Katmanı Migrasyonu** | ✅ Tamamlandı | Phase 2 / Phase 5 | Planner ve Tracker CRUD sorguları Supabase-first oldu. Dexie cache rolüne alındı. |
| **Sokratik Eğitmen & LaTeX** | ✅ Tamamlandı | Phase 5 | İpucu motoru, telemetri loglama ve custom LatexRenderer modülü tamamlandı. |
| **Feynman Hakemi & Puanlama**| ✅ Tamamlandı | Phase 6 | JSON çıktılı anlatım analizi, mnemoteknik kartı ve mastery sync aktif. |
| **Hata Zekası & FSRS Kartları**| ✅ Tamamlandı | Phase 7 | Hata tipi etiketleme, FSRS interval algoritması ve Workbench flashcard kartları aktif. |
| **Beyaz Tahta ve Ajan Çizimi** | ✅ Tamamlandı | Phase 8 / Phase 9 | Geometrik şekil ve matematiksel fonksiyon ($\sin(x)$, $x^2$ vb.) çizebilen akıllı canvas. |
| **Birleşik Workspace Tasarımı**| ✅ Tamamlandı | Phase 8 / UI-UX | Notion/Linear minimalizmiyle sol chat - sağ workbench şeklinde tek sayfada birleşti. |
| **Gereksiz Dosya Temizliği** | ✅ Tamamlandı | Refactor | `LearnDashboard`, `LearnFeynman`, `LearnFlashcards` silindi, route'lar sadeleştirildi. |
| **RAG Embeddings (pgvector)**| ✅ Tamamlandı | Phase 10 | PDF/TXT yükleme, akıllı chunking, pgvector embedding, cosine similarity araması, halüsinasyon önleme. |
| **OCR Hattı (Multimodal Giriş)**| ✅ Tamamlandı | Phase 11 | Kamera/clipboard/paste ile görsel yükleme, OpenRouter DeepSeek V4 Flash OCR, LaTeX temizleme, kullanıcı doğrulama modalı. |
| **LLM Provider Abstraction** | ✅ Tamamlandı | Phase 17 | `api/lib/llmClient.ts` ve `config.ts` katmanı; tüm API çağrıları (chat, feynman, mindmap, ocr, flashcard) tek bir istemci üzerinden yönetiliyor. |
| **React Flow Konu Ağacı** | ⏳ Beklemede | Phase 8.2 | Dashboard yerine Workbench sekmesinde etkileşimli kazanım ağacı kurulacak. |
| **Gelişmiş Onboarding**     | ⏳ Beklemede | Phase 18 | Öğrenci profili entegrasyonu ve hazır müfredat kavram ağaçları tohumlama. |
| **Mobil & PWA Entegrasyonu**| ⏳ Beklemede | Phase 19 | Workspace mobil uyumluluğu ve PWA çevrimdışı flashcard çalışması. |

---

## 4. Nerede Kaldık? (Sonraki Adımlar)

### 🎯 1. DALGA (Yüksek Öncelikli - Çekirdek Akış ve Canlıya Geçiş)
1. **Production Deploy & Smoke Test (Phase 16):**
   * RLS güvenlik denetimi, API rate limiting, Vitest unit testleri, Playwright E2E testleri, Vercel production deployment.
2. **Performans Optimizasyonu & Maliyet Yönetimi (Phase 15):**
   * Prompt caching optimizasyonu, context pruning, maliyet dashboard'u, code splitting/lazy loading.

### 🌟 2. DALGA (Derinleşme ve Adaptasyonlar)
1. **Gelişmiş Onboarding & Hazır Müfredat (Phase 18):**
   * Öğrenci profili, hedefleri ve öğrenme stili verilerinin alınarak sistem promptuna enjekte edilmesi; hazır üniversite müfredat kavram ağaçlarının tohumlanması.
2. **Mobil & PWA Entegrasyonu (Phase 19):**
   * `/learn` arayüzünün mobil uyumluluğu ve PWA manifest/service worker ile offline flashcard çalışması desteği.
3. **Diğer Modüller (Phase 12, 13, 14):**
   * CS Sandbox, Sınav Üretici ve INCUP (DEHB) adaptasyonları.
