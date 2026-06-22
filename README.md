# PLAN.EX

**Plan. Execute. Be Expert.**

PLAN.EX, ders ve is akisini tek yerde toplamak icin gelistirilen bir React + TypeScript uygulamasidir. Proje artik tam offline-first bir urun olarak degil, SaaS yonune gecen hibrit bir mimari olarak ilerliyor: Supabase auth, profil, onboarding durumu ve cloud bootstrap tarafinda aktif; planner ve tracker alan verileri ise halen Dexie tabanli local veritabani katmanlari uzerinde calisiyor.

## Guncel Durum

2026-03-12 itibariyla uygulamada sunlar canli:

- `/` rotasinda public landing
- Google ve GitHub OAuth girisi
- `/auth/callback` callback akisi
- `/auth/profile-setup` zorunlu profil tamamlama
- `/planner` icinde urun ustu 8 adimli onboarding overlay
- `/settings/profile` icinde profil duzenleme, avatar yukleme ve onboarding restart
- planner, calendar, habits, statistics, tracker ve settings icin protected route yapisi
- Supabase tabanli local-to-cloud bootstrap ve cloud-first conflict mantigi

Kritik not:

- `TASKS.md`, hedef mimaride alan verisinin tamamen Supabase'e tasinmasini tarif eder.
- Kod tabani bugun buna tam ulasmis degildir.
- Mevcut gercek: auth ve profil Supabase'te, core domain veri akisi ise hibrit bir durumda.

## Teknoloji Yigini

- React 18
- TypeScript 5.7
- Vite 6
- Tailwind CSS 3
- Framer Motion 12
- Supabase Auth / Database / Storage
- Dexie + IndexedDB
- Zustand
- Vitest
- Playwright

## Mimari Ozeti

### Auth ve kullanici kimligi

- Supabase Auth, giris katmanidir.
- Aktif provider'lar yalnizca `google` ve `github`'dir.
- Profil verisi `profiles` tablosunda tutulur.
- Profil modeli; `full_name`, `occupation`, `student_status`, `school`, `department`, `grade`, `avatar_url`, `preferred_locale`, `preferred_theme`, `profile_completed` ve `onboarding_completed` alanlarini kapsar.
- Giris sonrasi tema ve dil tercihleri profile geri senkronlanir.

### Domain veri katmani

- Planner ve tracker modulleri halen Dexie tabanli local veritabani katmanlari ile calisir.
- `PlannerDatabase` planner verileri icin kullanilir.
- `LifeFlowDB` tracker verileri icin kullanilir.
- `CloudDataBootstrap`, Supabase aktif ve profil tamam ise local veriyi cloud'a tasima ya da cloud'dan local cache hydrate etme akisini yonetir.
- Conflict durumunda cloud onceliklidir.

### UX yuzeyleri

- Public landing, profil kurulum ekrani ve protected app shell ayni tasarim dili uzerinde calisir.
- Landing ekraninda tema ve dil kontrolleri ilk viewport icinde gorunur kalir.
- Onboarding ayrica bir sayfa degil, urun ustunde calisan yonlendirme katmanidir.
- Yeni auth yuzeyleri reduced motion ve screen reader davranislarini destekler.

## Baslangic

### Gereksinimler

- Node.js 18+
- npm
- OAuth icin bir Supabase projesi

### Kurulum

```bash
npm install
```

`.env.example` dosyasini kopyalayip `.env.local` olarak duzenleyin. Lokal gelistirme icin en az su degerleri tanimlayin:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ALLOWED_AUTH_ORIGINS`

Ardindan:

```bash
npm run dev
```

Varsayilan development adresi: `http://localhost:3000`

Supabase OAuth icin lokal ayarlarda su origin ve callback adreslerini kullanin:

- Allowed origin: `http://localhost:3000`
- Callback URL: `http://localhost:3000/auth/callback`

Not:

- `.env.example` icindeki callback/origin degerlerini kendi ortamiza gore guncelleyin.
- Supabase env'leri eksikse landing acilir, ancak OAuth aksiyonlari disabled kalir.

## Ortam Degiskenleri

| Key | Gerekli | Amac |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Evet | Supabase proje URL'i |
| `VITE_SUPABASE_ANON_KEY` | Evet | Supabase anon key |
| `VITE_ALLOWED_AUTH_ORIGINS` | Onerilir | OAuth callback origin allowlist'i |
| `VITE_ENABLE_SYNC` | Opsiyonel | Local-to-cloud bootstrap ve sync akisini acar |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Opsiyonel | Gelecekteki odeme yuzeyleri |
| `VITE_ENABLE_GOOGLE_AUTH` | Opsiyonel | `false` verilirse Google provider kapanir |
| `VITE_ENABLE_GITHUB_AUTH` | Opsiyonel | `false` verilirse GitHub provider kapanir |

## Komutlar

| Komut | Aciklama |
| --- | --- |
| `npm run dev` | Development sunucusunu baslatir |
| `npm run build` | TypeScript build + Vite production build |
| `npm run preview` | Production build onizlemesi |
| `npm run lint` | ESLint calistirir |
| `npm run typecheck` | TypeScript `noEmit` kontrolu |
| `npm run test` | Vitest testleri |
| `npm run test:ui` | Vitest UI |
| `npm run test:e2e` | Playwright E2E testleri |
| `ANALYZE=true npm run build` | Bundle analyzer uretir |

## Route Haritasi

| Route | Aciklama |
| --- | --- |
| `/` | Public landing + OAuth CTA'lari |
| `/auth/callback` | OAuth callback sayfasi |
| `/auth/profile-setup` | Ilk giris profil tamamlama |
| `/planner` | Planner ana ekran |
| `/planner/courses` | Ders listesi |
| `/planner/courses/:courseId` | Ders detayi |
| `/planner/tasks` | Kisisel gorevler |
| `/planner/statistics` | Planner istatistikleri |
| `/calendar` | Takvim |
| `/habits` | Habits dashboard |
| `/habits/:habitId` | Habit detayi |
| `/tracker` | Tracker ana ekran |
| `/tracker/records` | Tracker kayitlari |
| `/tracker/stats` | Tracker istatistikleri |
| `/tracker/goals` | Goals |
| `/tracker/activities` | Activities |
| `/tracker/categories` | Categories |
| `/settings` | Genel ayarlar |
| `/settings/profile` | Profil ayarlari |

Legacy redirect'ler:

- `/tasks` -> `/planner/tasks`
- `/statistics` -> `/planner/statistics`

## Dizin Ozeti

```text
src/
├── app/                 # Router, layout, providers
├── modules/
│   ├── auth/            # Landing, callback, profile setup, onboarding, auth store
│   ├── planner/         # Planner modulu
│   ├── tracker/         # Time tracking modulu
│   └── settings/        # Settings + profile settings
├── db/                  # Dexie tabanli local veri katmani
├── i18n/                # TR / EN locale dosyalari
├── shared/              # Ortak component, hook ve util'ler
└── index.css            # Design tokens ve base styles
```

## Kalite ve Dogrulama

Tavsiye edilen minimum kontrol:

```bash
npm run typecheck
npm run test
npm run build
```

Repo genelinde `npm run lint` calistirmadan once mevcut uyarilarin ve eski borclarin temiz olup olmadigini kontrol edin; proje gecis halinde oldugu icin tum branch'lerde tertemiz lint sonucu garanti olmayabilir.

## Diger Dokumanlar

- `TASKS.md`: hedef SaaS mimarisi ve urun akisi
- `AGENT.md`: proje kimligi, mimari gercek ve constraint'ler
- `CLAUDE.md`: Claude Code odakli repo rehberi

## Deployment

- Framework: Vite
- Build komutu: `npm run build`
- Output dizini: `dist`
- Hedef platform: Vercel

PWA yapisi ve static asset optimizasyonlari `vite.config.ts` icinde tanimlidir.
