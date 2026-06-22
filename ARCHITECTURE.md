# ARCHITECTURE.md — PLAN.EX & STEMA Sistem İskeleti

Bu dosya, Firebase'den arındırılmış, **Supabase-first** mimariye taşınmış ve üzerine **STEMA** akıllı çalışma alanı entegre edilmiş PLAN.EX projesinin mimari iskeletini ve veri akışını yansıtır.

---

## 1. Üst Düzey Sistem Haritası

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                TARAYICI / İSTEMCİ                                 │
│                                                                                   │
│  ┌────────────────┐   ┌────────────────────────────────────────────────────────┐  │
│  │  Public Layer  │   │                Protected App Shell                     │  │
│  │ (unauthenticated)│  │   AppLayout + Sidebar + Header                         │  │
│  │                │   │                                                        │  │
│  │  /             │   │   /planner, /tracker, /habits, /calendar, /settings,   │  │
│  │  /auth/*       │   │   /learn (Birleşik Sokratik & Feynman Çalışma Alanı)   │  │
│  │  └────────────────┘   └───────────┬────────────────────────────────────────────┘  │
│          │                           │                                            │
│          ▼                           ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                       Veri Katmanı (Supabase-First)                         │  │
│  │                                                                             │  │
│  │   Primary Writes & Reads: Supabase (Auth, RLS, Domain & STEMA Data)         │  │
│  │   Local Cache & Hydration: Dexie (Planner / Tracker Offline Cache)          │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Sistem Bileşenleri

### 2.1 Uygulama Kabuğu (`src/app/`)

| Bileşen | Dosya | Sorumluluk |
|---|---|---|
| Route Ağacı | `App.tsx` | Public ve protected route katmanlarını ayırır. `/learn` rotasını ve alt redirect'leri yönetir. |
| Authenticated Shell | `layouts/AppLayout.tsx` | Sidebar, header, nav — yalnızca login sonrası. |
| Auth Bootstrap | `providers/AuthProvider.tsx` | Supabase session'ı sağlar ve yönetir. |
| Cloud Bootstrap | `providers/CloudDataBootstrap.tsx` | Remote defaults seeding, yerel veriden buluta aktarım promptları ve cache temizliği. |
| Profil Sync | `providers/ProfilePreferencesSync.tsx` | Tema/locale değişikliğini profile yazar. |
| Tema Yönetimi | `providers/ThemeProvider.tsx` | CSS custom variables tabanlı dark/light yönetimi. Grayscale estetiğini korur. |

### 2.2 Auth Modülü (`src/modules/auth/`)

| Alt Klasör | Sorumluluk |
|---|---|
| `pages/` | `PublicLandingPage` (tek CTA, minimalist), `AuthCallbackPage`, `ProfileCompletionPage`. |
| `components/` | `AuthGuard`, `ProtectedRoute`, `OAuthButtons` (Google/GitHub), `OnboardingOrchestrator` ve coachmark'lar. |
| `store/` | `authStore.ts` — session, profil tamamlanma, onboarding adımları ve preference sync. |
| `lib/` | OAuth yönlendirmeleri, profil yardımcıları, güvenlik şemaları ve telemetri. |

### 2.3 Planner Modülü (`src/modules/planner/`)

| Alt Klasör | Sorumluluk |
|---|---|
| `pages/` | Overview, Courses, CourseDetail, PersonalTasks, Habits, HabitDetail, Calendar, Statistics. |
| `store/` | `plannerAppStore.ts` (uygulama state'i), `plannerUIStore.ts` (arayüz durumları). |
| `queries/` | `courseQueries.ts`, `taskQueries.ts` vb. (`useSupabaseQuery` hook'unu kullanan Supabase CRUD katmanı). |

### 2.4 Tracker Modülü (`src/modules/tracker/`)

| Alt Klasör / Dosya | Sorumluluk |
|---|---|
| `pages/` | TrackerPage, RecordsPage, StatsPage, GoalsPage, ActivitiesPage, CategoriesPage. |
| `lib/` | `timerService.ts` (süre başlatma/durdurma), `ruleEngine.ts` (kural kontrolleri), `suggestionEngine.ts` (oturum önerileri), `exportService.ts` (CSV/JSON export). |
| `queries/` | `activityQueries.ts`, `sessionQueries.ts` vb. (Supabase CRUD katmanı). |

### 2.5 STEMA Öğrenme Modülü (`src/modules/learn/`)

| Alt Klasör / Dosya | Sorumluluk |
|---|---|
| `pages/LearnChat.tsx` | **Birleşik Çalışma Alanı (Workspace):** Sol panelde Sokratik, Feynman veya Serbest AI sohbet akışını, sağ panelde ise interaktif Workbench'i barındırır. |
| `components/Whiteboard.tsx` | **Akıllı Çizim Tuvali:** Hem kullanıcının serbest el/geometrik şekil çizmesini sağlar hem de yapay zekadan gelen plot/grafik komutlarını canvas'a çizer. |
| `components/LatexRenderer.tsx`| **Custom LaTeX & Markdown Parser:** Satır içi ve blok KaTeX ifadelerini ve temel markdown kurallarını harici ağır bağımlılıklar olmadan render eder. |
| `lib/fsrs.ts` | **FSRS Kart Zamanlayıcı:** Flashcard'ların bir sonraki görünme tarihini (due_at), kararlılığını (stability) ve zorluğunu hesaplayan SuperMemo tabanlı algoritma. |

### 2.6 Bulut Katmanı (`src/lib/cloud/`)

| Dosya | Sorumluluk |
|---|---|
| `supabaseRepo.ts` | Alt seviye Supabase CRUD işlemleri, hata yakalama ve connection handling. |
| `plannerRepo.ts` | Planner alanına özel ders, görev, etkinlik, alışkanlık veri tabanı operasyonları. |
| `trackerRepo.ts` | Tracker alanına özel süre, kural, kategori ve aktivite veri tabanı operasyonleri. |
| `queryInvalidation.ts` | Bir tablo güncellendiğinde ilgili queries aboneliklerini uyaran pub/sub cache geçersizleştirici. |
| `domainSync.ts` | Geriye dönük uyumluluk ve yerel veri tabanını bulut verileriyle besleme (hydration). |

---

## 3. Veri Akışı ve Senkronizasyon

### 3.1 Planner / Tracker Veri Akışı (Supabase-First)

Tüm veri okumaları ve yazmaları reaktif olarak doğrudan Supabase üzerinden yürütülür. Dexie IndexedDB veriyi yerelde önbelleğe alır ancak tek başına yetkili yazma mercii (source-of-truth) değildir.

```
[React Bileşeni]
    │ (useSupabaseQuery)
    ▼
[queryInvalidation (Pub/Sub Cache)]
    │ (Tetiklenir / Okunur)
    ▼
[plannerRepo / trackerRepo]
    │ (CRUD İşlemleri)
    ├────────────────────────┐
    ▼                        ▼
[Supabase (Cloud SQL)]   [Dexie (Local Cache)]
```

### 3.2 STEMA Workbench Entegrasyon Akışı

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI Sohbet Akışı (Chat)                          │
│                                                                        │
│  Öğrenci sorusu sorar ──► AI modeli (Gemini/DeepSeek) cevabı hazırlar  │
│                                │                                       │
│                                ▼                                       │
│          Cevap içinde whiteboard komutları veya JSON varsa             │
│            (Örn: `[WHITEBOARD_DRAW: {type: "plot", fn: "sin(x)"}]`)    │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │ (Abonelik / Eşleşme)
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       STEMA Workbench (Sağ Panel)                      │
│                                                                        │
│  ├─ Beyaz Tahta ──► Çizim motoru canvas üzerine grafikleri çizer.      │
│  ├─ FSRS Tekrar ──► Hatalardan üretilen kartlar veritabanına yazılır.  │
│  ├─ Notlar/Döküman ──► Supabase `documents` tablosuna aktarım.          │
│  └─ Kavramlar ──► Güncellenen mastery skorlarını reaktif listeler.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Veritabanı Tablo Yapısı

Supabase üzerinde toplam **18+ domain ve STEMA tablosu** bulunmaktadır. RLS kuralları `auth.uid() = user_id` şartıyla korunmaktadır:

1.  `profiles`: Kullanıcı kimlik, tercih ve avatar bilgileri.
2.  `courses` & `units`: Dersler ve ilgili müfredat üniteleri.
3.  `tasks` & `personal_tasks`: Ders görevleri ve bağımsız kişisel görevler.
4.  `events`: Takvim etkinlikleri ve FSRS tekrar günleri.
5.  `habits` & `habit_logs`: Alışkanlık takipleri ve günlük tamamlama kayıtları.
6.  `activities` & `categories`: Tracker zaman aktiviteleri ve kategorileri.
7.  `time_sessions` & `running_timers`: Kronometre kayıtları ve aktif sayaçlar.
8.  `goals`: Zaman hedefleri.
9.  `reminders`: Sistem içi hatırlatıcılar.
10. `rules`: Tracker kuralları.
11. `completion_records`: Tamamlanan etkinlik kayıtları.
12. `settings` & `pomodoro_configs`: Kullanıcı arayüz tercihleri ve pomodoro süreleri.
13. `sessions` & `messages`: STEMA sohbet oturumları ve mesaj içerikleri.
14. `concepts` & `concept_mastery`: Bilişsel STEM konuları ve öğrencinin puanları.
15. `error_logs`: Yapılan hataların sınıflandırmaları (procedural, conceptual vb.).
16. `sr_cards`: FSRS tabanlı aralıklı tekrar kartları.
17. `documents` & `document_chunks`: RAG amaçlı pdf/not dosyaları ve vektörel embedding'ler.
18. `tutor_events`: Metakognitif davranış takibi için telemetri günlüğü.

---

## 5. Klasör Sorumlulukları

```
src/
├── app/             → Route yönetimi, ana Layout (AppLayout) ve provider'lar
├── modules/
│   ├── auth/        → Giriş ekranı, callback handler, onboarding overlay
│   ├── planner/     → Ders, takvim, görev ve alışkanlık UI sayfaları
│   ├── tracker/     → Zamanlayıcı, kronometre, kategoriler ve hedefler
│   ├── settings/    → Profil ayarları, şifre ve avatar yükleme ekranı
│   └── learn/       → STEMA Workspace, Whiteboard, LatexRenderer, FSRS kartları
├── db/              → Dexie Database şemaları ve offline senkronizasyon araçları
├── lib/
│   ├── cloud/       → plannerRepo, trackerRepo ve cache invalidation altyapısı
│   └── validation/  → Form ve veri şeması doğrulamaları (Zod)
├── config/          → Lucide ikon kataloğu, default şablonlar ve Supabase client init
├── i18n/            → Dil çeviri dosyaları (TR / EN) ve i18next konfigurasyonu
└── shared/          → useSupabaseQuery, LatexRenderer, modal vb. paylaşılan bileşenler
```

---

## 6. Nerede Ne Değiştirilmeli

*   **Sokratik / Feynman AI davranış kuralları:** `api/chat.ts` veya `api/feynman.ts` içindeki sistem promptları.
*   **Beyaz tahtaya yeni bir çizim fonksiyonu veya grafik plot türü eklemek:** `src/modules/learn/components/Whiteboard.tsx` içindeki parser ve canvas drawing metodları.
*   **FSRS algoritma katsayılarını ve öğrenme gecikmelerini düzenlemek:** `src/modules/learn/lib/fsrs.ts`.
*   **Veritabanı CRUD sorgusu eklemek veya güncellemek:** İlgili domain reposu (`plannerRepo.ts` veya `trackerRepo.ts`).
*   **UI Tema token'ları veya Notion/Linear stilleri:** `src/index.css` ve `tailwind.config.js`.

---

## 7. Çift Katman Durumu

IndexedDB (Dexie) ve Supabase paralel olarak varlığını sürdürmektedir ancak **Supabase yegane veri kaynağıdır.**
*   Uygulama açılırken veya veri yazılırken `CloudDataBootstrap` ve repo katmanları Supabase'e yazar, Dexie'yi ise sadece hızlı çevrimdışı okumalar ve bootstrap aşamasındaki hydration için günceller.
*   Kullanıcı internet bağlantısı koptuğunda sistem verileri Dexie'den okuyabilir, ancak yazma işlemlerinde öncelikli hedef bulut API'sidir.

---

## 8. Test Stratejisi

*   **Birim ve Bileşen Testleri:** `tests/planner/*.test.ts` ve `tests/tracker/*.test.ts` Vitest ve React Testing Library ile yerel IndexedDB mock'ları (`fake-indexeddb`) eşliğinde çalıştırılır.
*   **Güvenlik (RLS) Testleri:** `tests/rls/rlsSmoke.test.ts` ile yetkisiz erişim denetimleri yapılır.
*   **Doğrulama:** Proje genelinde TypeScript derleme doğruluğu (`npm run typecheck`) ve production derlemesi (`npm run build`) ile kod bütünlüğü garanti altına alınır.
