import { lazy } from 'react'

const loadOverviewPage = () => import('@/modules/planner/pages/OverviewPage')
const loadCalendarPage = () => import('@/modules/planner/pages/CalendarPage')
const loadStatisticsPage = () => import('@/modules/planner/pages/StatisticsPage')
const loadHabitsDashboardPage = () => import('@/modules/planner/pages/HabitsDashboardPage')
const loadHabitDetailPage = () => import('@/modules/planner/pages/HabitDetailPage')
const loadSettingsPage = () => import('@/modules/settings/pages/Settings')
const loadProfileSettingsPage = () => import('@/modules/settings/pages/ProfileSettingsPage')
const loadCoursesPage = () => import('@/modules/planner/pages/CoursesPage')
const loadCourseDetailPage = () => import('@/modules/planner/pages/CourseDetailPage')
const loadPersonalTasksPage = () => import('@/modules/planner/pages/PersonalTasksPage')
const loadTrackerPage = () => import('@/modules/tracker/pages/TrackerPage')
const loadRecordsPage = () => import('@/modules/tracker/pages/RecordsPage')
const loadTrackerStatsPage = () => import('@/modules/tracker/pages/StatsPage')
const loadGoalsPage = () => import('@/modules/tracker/pages/GoalsPage')
const loadActivitiesPage = () => import('@/modules/tracker/pages/ActivitiesPage')
const loadCategoriesPage = () => import('@/modules/tracker/pages/CategoriesPage')
const loadLearnChatPage = () => import('@/modules/learn/pages/LearnChat')
const loadMindmapPage = () => import('@/modules/learn/pages/MindmapPage')

const protectedRouteModuleLoaders = [
    loadOverviewPage,
    loadCalendarPage,
    loadStatisticsPage,
    loadHabitsDashboardPage,
    loadHabitDetailPage,
    loadSettingsPage,
    loadProfileSettingsPage,
    loadCoursesPage,
    loadCourseDetailPage,
    loadPersonalTasksPage,
    loadTrackerPage,
    loadRecordsPage,
    loadTrackerStatsPage,
    loadGoalsPage,
    loadActivitiesPage,
    loadCategoriesPage,
    loadLearnChatPage,
    loadMindmapPage,
]

let preloadProtectedRouteModulesPromise: Promise<void> | null = null

export function preloadProtectedRouteModules() {
    if (!preloadProtectedRouteModulesPromise) {
        preloadProtectedRouteModulesPromise = Promise
            .allSettled(protectedRouteModuleLoaders.map(loadModule => loadModule()))
            .then(() => undefined)
    }

    return preloadProtectedRouteModulesPromise
}

export const LazyDashboard = lazy(() => loadOverviewPage().then(module => ({ default: module.OverviewPage })))
export const LazyCalendar = lazy(() => loadCalendarPage().then(module => ({ default: module.CalendarPage })))
export const LazyStatistics = lazy(() => loadStatisticsPage().then(module => ({ default: module.StatisticsPage })))
export const LazyHabits = lazy(() => loadHabitsDashboardPage().then(module => ({ default: module.HabitsDashboardPage })))
export const LazyHabitDetail = lazy(() => loadHabitDetailPage().then(module => ({ default: module.HabitDetailPage })))
export const LazySettings = lazy(() => loadSettingsPage().then(module => ({ default: module.Settings })))
export const LazyProfileSettings = lazy(() => loadProfileSettingsPage().then(module => ({ default: module.ProfileSettingsPage })))
export const LazyCourses = lazy(() => loadCoursesPage().then(module => ({ default: module.CoursesPage })))
export const LazyCourseDetail = lazy(() => loadCourseDetailPage().then(module => ({ default: module.CourseDetailPage })))
export const LazyTasks = lazy(() => loadPersonalTasksPage().then(module => ({ default: module.PersonalTasksPage })))
export const LazyTracker = lazy(() => loadTrackerPage().then(module => ({ default: module.TrackerPage })))
export const LazyRecords = lazy(() => loadRecordsPage().then(module => ({ default: module.RecordsPage })))
export const LazyTrackerStats = lazy(() => loadTrackerStatsPage().then(module => ({ default: module.StatsPage })))
export const LazyGoals = lazy(() => loadGoalsPage().then(module => ({ default: module.GoalsPage })))
export const LazyActivities = lazy(() => loadActivitiesPage().then(module => ({ default: module.ActivitiesPage })))
export const LazyCategories = lazy(() => loadCategoriesPage().then(module => ({ default: module.CategoriesPage })))
export const LazyLearnChat = lazy(() => loadLearnChatPage().then(module => ({ default: module.LearnChat })))
export const LazyMindmap = lazy(() => loadMindmapPage().then(module => ({ default: module.MindmapPage })))
