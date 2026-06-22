import {
    Activity,
    BarChart2,
    BookOpen,
    Brain,
    Calendar,
    Home,
    ListTodo,
    Settings,
    Timer,
    type LucideIcon,
} from 'lucide-react'

export interface AppNavItem {
    id: 'overview' | 'courses' | 'tasks' | 'habits' | 'tracker' | 'calendar' | 'stats' | 'settings' | 'learn'
    labelKey: string
    icon: LucideIcon
    href: string
}

export const APP_NAV_ITEMS: AppNavItem[] = [
    { id: 'overview', labelKey: 'navigation.home', icon: Home, href: '/planner' },
    { id: 'courses', labelKey: 'navigation.courses', icon: BookOpen, href: '/planner/courses' },
    { id: 'tasks', labelKey: 'navigation.tasks', icon: ListTodo, href: '/planner/tasks' },
    { id: 'habits', labelKey: 'navigation.habits', icon: Activity, href: '/habits' },
    { id: 'tracker', labelKey: 'navigation.tracker', icon: Timer, href: '/tracker' },
    { id: 'calendar', labelKey: 'navigation.calendar', icon: Calendar, href: '/calendar' },
    { id: 'stats', labelKey: 'navigation.statistics', icon: BarChart2, href: '/planner/statistics' },
    { id: 'learn', labelKey: 'navigation.learn', icon: Brain, href: '/learn' },
    { id: 'settings', labelKey: 'navigation.settings', icon: Settings, href: '/settings' },
]

export const MOBILE_PRIMARY_NAV_IDS: AppNavItem['id'][] = ['overview', 'courses', 'tracker', 'habits']

export function isNavItemActive(pathname: string, href: string) {
    if (href === '/planner') {
        return pathname === '/planner'
    }

    return pathname === href || pathname.startsWith(`${href}/`)
}
