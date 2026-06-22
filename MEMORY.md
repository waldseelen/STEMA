# PLAN-EX Project Memory

## Project Overview
React + TypeScript SPA — öğrenci planlama uygulaması.
Stack: Vite, React 18, Framer Motion, Zustand, Dexie (IndexedDB), i18n, echarts, TailwindCSS.
Test baseline: **282 tests passing** (as of 2026-03-14)

## Architecture
- `src/app/` — layout, routing, providers
- `src/modules/` — planner, tracker, settings
- `src/shared/` — shared components, hooks, utils
- `src/i18n/` — i18n config + locale files (namespaces: common, auth, landing, onboarding, planner, tracker, calendar, habits, settings)

## i18n Key Convention
Locale files wrap keys under their namespace name: `{ "onboarding": { "progress": "..." } }`.
Translation functions must use full-path keys: `t('onboarding.progress')`, NOT `t('progress')`.
This applies everywhere — including `OnboardingCoachmark` (`tOnboarding('onboarding.xxx')`).

## Design Token Reference
- `bg-background` → `var(--bg-primary)` (light: #FAFAFA / dark: #050505)
- `bg-surface-100/200/300` → surface hierarchy
- `text-text-primary/secondary/muted` → text hierarchy
- `status-violet/green/amber/red/blue` → semantic status renkler (dot, badge, border-l)
- `status-*-soft` → status/10 (light) veya /12-15 (dark) — badge bg için
- accent → violet (#7C3AED light / #8B5CF6 dark)

## Key Rules (Renk Katman Mimarisi)
- Kart/modal/sidebar arka planı → sadece monochrome token'lar
- Primary buton → bg-black text-white (light) / bg-white text-black (dark)
- Status/urgency → sadece dot(8px), border-l-2(3px), badge-outline
- Course sol şerit / takvim dot / progress bar → `course.color` (veri rengi, doğru kullanım)
- ASLA renk kart arka planı yapma
- Motion: 180-200ms standard easing only; spring easing yasak

## Completed Passes (Chronological)

### ✅ Visual Rework (Faz 1-6) — TAMAMLANDI
Token reset, Nav, Layout/Ambient, Kart/Bileşenler, Sayfa bazlı, Polish (reduced-motion).
Detay: `memory/visual_rework.md`

### ✅ Optimizations (Phase 0-5) — TAMAMLANDI (2026-03-11)
Set-based lookups, useMemo guards, Zustand→Dexie migrations for all planner pages,
CommandBar lazy-mount, RightPanel O(1) maps, test baseline 238→282.
Detay: `memory/optimizations.md`

### ✅ Design Overhaul 9-Faz — TAMAMLANDI (2026-03-13)
Token reset, typography, component reset (rounded-lg, scale(0.985)), motion cleanup,
landing update, app shell h-14, onboarding spring→standard, module icon neutral.
Detay: `memory/design_overhaul.md`

### ✅ Exposed-Flow Stabilization — TAMAMLANDI (2026-03-14)
**Test baseline fixed: 5 failing → 282 passing**
- `src/i18n/locales/tr/onboarding.json` + `en/onboarding.json`: 8-step keys eklendi
  (welcome, modules, planner, tracker, habits, calendar, goals, usage + begin/gotIt/start + moduleCards + usageOptions)
- `src/modules/auth/components/OnboardingCoachmark.tsx`: tOnboarding key-path bug düzeltildi
  (`'progress'` → `'onboarding.progress'` vb. — tüm shorthand keyler düzeltildi)
- `src/modules/auth/pages/AuthPage.tsx`: footer'a `v1.0.0` eklendi
- `tests/auth/authFlow.test.tsx`: fallback testi için step 0→1→2 click simülasyonu eklendi
- `tests/components/ActivityEditModal.test.tsx`: `ToastProvider` wrapper + icon picker click

## Onboarding 8-Step Contract (OnboardingOrchestrator)
Steps (kind): welcome, modules, planner (target:dashboard-hero), tracker (target:nav-tracker),
habits (target:dashboard-section-habits), calendar (target:nav-calendar),
goals (target:quick-actions), usage
primaryLabels: begin → common.next × 5 → start

## Test Setup Notes
- `tests/` — all test files, Vitest + RTL + fake-indexeddb
- Components using `useToast()` require `<ToastProvider>` wrapper in tests
- `OnboardingOrchestrator` requires `<ToastProvider>` + `<MemoryRouter>` + `data-onboarding-target` DOM nodes
- Icon picker headings (Study & Education etc.) only visible after clicking the icon toggle button
