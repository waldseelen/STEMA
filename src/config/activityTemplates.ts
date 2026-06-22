import { COURSE_COLORS } from '@/modules/planner/types'

export interface ActivityTemplate {
    name: string
    icon: string
    color: string
    category: 'Ders' | 'Sağlık' | 'Üretkenlik' | 'Yaşam' | 'Finans'
    defaultGoal?: {
        scope: 'daily' | 'weekly'
        targetHours: number
    }
}

const [
    red,
    orange,
    amber,
    yellow,
    lime,
    green,
    emerald,
    teal,
    cyan,
    sky,
    blue,
    indigo,
    violet,
    purple,
    fuchsia,
    pink,
    rose,
    stone,
    slate,
    gray,
] = COURSE_COLORS

const activityTemplates = [
    { name: 'Matematik', icon: 'Calculator', color: indigo, category: 'Ders', defaultGoal: { scope: 'daily', targetHours: 2 } },
    { name: 'Fizik', icon: 'Atom', color: violet, category: 'Ders' },
    { name: 'Kimya', icon: 'FlaskConical', color: purple, category: 'Ders' },
    { name: 'Programlama', icon: 'Code2', color: blue, category: 'Ders', defaultGoal: { scope: 'daily', targetHours: 3 } },
    { name: 'İngilizce', icon: 'Languages', color: sky, category: 'Ders' },
    { name: 'Proje Çalışma', icon: 'FolderOpen', color: cyan, category: 'Ders' },
    { name: 'Okuma', icon: 'BookOpen', color: teal, category: 'Ders', defaultGoal: { scope: 'daily', targetHours: 1 } },
    { name: 'Not Alma', icon: 'PenLine', color: emerald, category: 'Ders' },
    { name: 'Araştırma', icon: 'Search', color: green, category: 'Ders' },
    { name: 'Ödev', icon: 'ClipboardList', color: lime, category: 'Ders' },
    { name: 'Sınav Hazırlık', icon: 'GraduationCap', color: yellow, category: 'Ders', defaultGoal: { scope: 'daily', targetHours: 3 } },
    { name: 'Flashcard', icon: 'Brain', color: amber, category: 'Ders' },
    { name: 'Video Ders', icon: 'Play', color: orange, category: 'Ders' },
    { name: 'Makale Okuma', icon: 'FileText', color: red, category: 'Ders' },
    { name: 'Pratik Yapma', icon: 'Target', color: rose, category: 'Ders' },

    { name: 'Spor', icon: 'Dumbbell', color: green, category: 'Sağlık', defaultGoal: { scope: 'daily', targetHours: 1 } },
    { name: 'Koşu', icon: 'Footprints', color: emerald, category: 'Sağlık' },
    { name: 'Yürüyüş', icon: 'MapPin', color: teal, category: 'Sağlık', defaultGoal: { scope: 'weekly', targetHours: 5 } },
    { name: 'Uyku', icon: 'Moon', color: indigo, category: 'Sağlık', defaultGoal: { scope: 'daily', targetHours: 8 } },
    { name: 'Meditasyon', icon: 'Smile', color: violet, category: 'Sağlık' },
    { name: 'Beslenme', icon: 'Apple', color: lime, category: 'Sağlık' },
    { name: 'Su İçme', icon: 'Droplets', color: sky, category: 'Sağlık' },
    { name: 'Yoga', icon: 'Activity', color: purple, category: 'Sağlık', defaultGoal: { scope: 'weekly', targetHours: 3 } },
    { name: 'Bisiklet', icon: 'Bike', color: orange, category: 'Sağlık' },
    { name: 'Yüzme', icon: 'Waves', color: cyan, category: 'Sağlık' },
    { name: 'Esneme', icon: 'Heart', color: pink, category: 'Sağlık' },
    { name: 'Nefes Egzersizi', icon: 'Wind', color: fuchsia, category: 'Sağlık' },

    { name: 'E-posta', icon: 'Mail', color: slate, category: 'Üretkenlik' },
    { name: 'Toplantı', icon: 'Users', color: stone, category: 'Üretkenlik' },
    { name: 'Planlama', icon: 'Calendar', color: indigo, category: 'Üretkenlik' },
    { name: 'Deep Work', icon: 'Zap', color: amber, category: 'Üretkenlik', defaultGoal: { scope: 'daily', targetHours: 4 } },
    { name: 'Admin İşleri', icon: 'Inbox', color: gray, category: 'Üretkenlik' },
    { name: 'Yazışma', icon: 'MessageCircle', color: sky, category: 'Üretkenlik' },
    { name: 'İçerik Üretim', icon: 'PenTool', color: pink, category: 'Üretkenlik' },
    { name: 'Tasarım', icon: 'Figma', color: purple, category: 'Üretkenlik' },
    { name: 'Kodlama', icon: 'Terminal', color: blue, category: 'Üretkenlik', defaultGoal: { scope: 'daily', targetHours: 3 } },
    { name: 'Code Review', icon: 'GitPullRequest', color: green, category: 'Üretkenlik' },
    { name: 'Dokümantasyon', icon: 'FileText', color: cyan, category: 'Üretkenlik' },
    { name: 'Görev Yönetimi', icon: 'ListTodo', color: violet, category: 'Üretkenlik' },

    { name: 'Aile', icon: 'Home', color: orange, category: 'Yaşam' },
    { name: 'Arkadaşlar', icon: 'Users', color: yellow, category: 'Yaşam' },
    { name: 'Alışveriş', icon: 'ShoppingCart', color: lime, category: 'Yaşam' },
    { name: 'Ulaşım', icon: 'Car', color: slate, category: 'Yaşam' },
    { name: 'Müzik', icon: 'Music', color: purple, category: 'Yaşam' },
    { name: 'Film / Dizi', icon: 'Tv', color: indigo, category: 'Yaşam' },
    { name: 'Oyun', icon: 'Gamepad2', color: blue, category: 'Yaşam' },
    { name: 'Hobiler', icon: 'Star', color: amber, category: 'Yaşam' },
    { name: 'Kahve Molası', icon: 'Coffee', color: stone, category: 'Yaşam' },
    { name: 'Fotoğrafçılık', icon: 'Camera', color: pink, category: 'Yaşam' },
    { name: 'Ev Düzeni', icon: 'Sparkles', color: emerald, category: 'Yaşam' },
    { name: 'Yemek Pişirme', icon: 'UtensilsCrossed', color: red, category: 'Yaşam' },

    { name: 'Bütçe Takip', icon: 'Wallet', color: green, category: 'Finans', defaultGoal: { scope: 'weekly', targetHours: 1 } },
    { name: 'Yatırım', icon: 'TrendingUp', color: emerald, category: 'Finans' },
    { name: 'Fatura', icon: 'Receipt', color: red, category: 'Finans' },
    { name: 'Tasarruf', icon: 'PiggyBank', color: amber, category: 'Finans', defaultGoal: { scope: 'weekly', targetHours: 1 } },
    { name: 'Freelance', icon: 'DollarSign', color: lime, category: 'Finans' },
    { name: 'Gider Analizi', icon: 'BarChart2', color: cyan, category: 'Finans' },
    { name: 'Gelir Planlama', icon: 'Banknote', color: blue, category: 'Finans' },
    { name: 'Kart Ekstresi', icon: 'CreditCard', color: violet, category: 'Finans' },
    { name: 'Vergi Takibi', icon: 'Calculator', color: slate, category: 'Finans' },
    { name: 'Fiyat Karşılaştırma', icon: 'ShoppingBasket', color: orange, category: 'Finans' },
] satisfies ActivityTemplate[]

export const ACTIVITY_TEMPLATES: ActivityTemplate[] = activityTemplates

export const ACTIVITY_TEMPLATE_CATEGORY_LABEL_KEYS: Record<ActivityTemplate['category'], string> = {
    Ders: 'activity.templateCategories.study',
    Sağlık: 'activity.templateCategories.health',
    Üretkenlik: 'activity.templateCategories.productivity',
    Yaşam: 'activity.templateCategories.life',
    Finans: 'activity.templateCategories.finance',
}

export const ACTIVITY_TEMPLATE_LABEL_KEYS: Record<string, string> = {
    Matematik: 'activity.templates.mathematics',
    Fizik: 'activity.templates.physics',
    Kimya: 'activity.templates.chemistry',
    Programlama: 'activity.templates.programming',
    İngilizce: 'activity.templates.english',
    'Proje Çalışma': 'activity.templates.projectWork',
    Okuma: 'activity.templates.reading',
    'Not Alma': 'activity.templates.noteTaking',
    Araştırma: 'activity.templates.research',
    Ödev: 'activity.templates.homework',
    'Sınav Hazırlık': 'activity.templates.examPreparation',
    Flashcard: 'activity.templates.flashcards',
    'Video Ders': 'activity.templates.videoLessons',
    'Makale Okuma': 'activity.templates.articleReading',
    'Pratik Yapma': 'activity.templates.practice',
    Spor: 'activity.templates.sports',
    Koşu: 'activity.templates.running',
    Yürüyüş: 'activity.templates.walking',
    Uyku: 'activity.templates.sleep',
    Meditasyon: 'activity.templates.meditation',
    Beslenme: 'activity.templates.nutrition',
    'Su İçme': 'activity.templates.hydration',
    Yoga: 'activity.templates.yoga',
    Bisiklet: 'activity.templates.cycling',
    Yüzme: 'activity.templates.swimming',
    Esneme: 'activity.templates.stretching',
    'Nefes Egzersizi': 'activity.templates.breathingExercises',
    'E-posta': 'activity.templates.email',
    Toplantı: 'activity.templates.meetings',
    Planlama: 'activity.templates.planning',
    'Deep Work': 'activity.templates.deepWork',
    'Admin İşleri': 'activity.templates.adminTasks',
    Yazışma: 'activity.templates.messaging',
    'İçerik Üretim': 'activity.templates.contentCreation',
    Tasarım: 'activity.templates.design',
    Kodlama: 'activity.templates.coding',
    'Code Review': 'activity.templates.codeReview',
    Dokümantasyon: 'activity.templates.documentation',
    'Görev Yönetimi': 'activity.templates.taskManagement',
    Aile: 'activity.templates.family',
    Arkadaşlar: 'activity.templates.friends',
    Alışveriş: 'activity.templates.shopping',
    Ulaşım: 'activity.templates.transport',
    Müzik: 'activity.templates.music',
    'Film / Dizi': 'activity.templates.moviesSeries',
    Oyun: 'activity.templates.gaming',
    Hobiler: 'activity.templates.hobbies',
    'Kahve Molası': 'activity.templates.coffeeBreak',
    'Fotoğrafçılık': 'activity.templates.photography',
    'Ev Düzeni': 'activity.templates.homeOrganization',
    'Yemek Pişirme': 'activity.templates.cooking',
    'Bütçe Takip': 'activity.templates.budgetTracking',
    Yatırım: 'activity.templates.investing',
    Fatura: 'activity.templates.bills',
    Tasarruf: 'activity.templates.saving',
    Freelance: 'activity.templates.freelance',
    'Gider Analizi': 'activity.templates.expenseAnalysis',
    'Gelir Planlama': 'activity.templates.incomePlanning',
    'Kart Ekstresi': 'activity.templates.cardStatement',
    'Vergi Takibi': 'activity.templates.taxTracking',
    'Fiyat Karşılaştırma': 'activity.templates.priceComparison',
}

export function getTemplatesByCategory(
    category: ActivityTemplate['category']
): ActivityTemplate[] {
    return ACTIVITY_TEMPLATES.filter(template => template.category === category)
}
