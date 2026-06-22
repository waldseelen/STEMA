/**
 * Planner Database - Query Layer Index
 *
 * Tüm query fonksiyonları ve hooks export.
 */

// Database & helpers
export { clearPlannerData, generateId, nowISO, plannerDb, todayKey } from './database'

// Types
export * from './types'

// Course queries
export {
    addCourse, deleteCourse, getAllCourses,
    getCourseById,
    getCoursesWithProgress, reorderCourses, updateCourse, useCourse, useCourseCount, useCourses, useCoursesWithProgress
} from './queries/courseQueries'

// Unit queries
export {
    addUnit, deleteUnit, getUnitById, getUnitsByCourse, getUnitsWithTasks, reorderUnits, updateUnit, useUnit, useUnitsByCourse, useUnitsWithTasks
} from './queries/unitQueries'

// Task queries
export {
    addTask, deleteTask, filterTasks, getCompletedTasksCount, getOverdueTasks, getTaskById, getTaskWithContext, getTasksByCourse,
    getTasksByCourseAndStatus,
    getTasksByDueDateRange, getTasksByUnit, getTasksDueToday, getTotalTasksCount, reorderTasks, toggleTaskCompletion, updateTask, useCourseProgress, useOverdueTasks, useTask, useTasksByCourse, useTasksByUnit, useTasksDueToday
} from './queries/taskQueries'

// Event queries
export {
    addEvent, countEventsByType, deleteEvent,
    deleteEventsByCourse, getEventById, getEventsByCourse, getEventsByDate,
    getEventsByDateRange,
    getEventsByDateRangeGrouped, getEventsByTypeAndDateRange, getTodayEvents,
    getUpcomingEventsWithinDays, getUpcomingExams, updateEvent, useEvent, useEventsByCourse, useEventsByDate,
    useEventsByDateRange,
    useEventsByDateRangeGrouped,
    useTodayEvents,
    useUpcomingExams
} from './queries/eventQueries'

// Personal task queries
export {
    addPersonalTask, deletePersonalTask, getAllPersonalTasks, getCompletedPersonalTasksCount, getIncompletePersonalTasks, getOverduePersonalTasks, getPersonalTaskById,
    getPersonalTasksByStatus,
    getPersonalTasksDueToday, reorderPersonalTasks, togglePersonalTaskCompletion, updatePersonalTask, useIncompletePersonalTasks, usePersonalTask, usePersonalTasks, usePersonalTasksByStatus, usePersonalTasksDueToday
} from './queries/personalTaskQueries'

// Habit queries
export {
    addHabit, archiveHabit, deleteHabit, getActiveHabits, getAllHabits, getArchivedHabits,
    getHabitById, getHabitLogForDate, getHabitLogs, getHabitLogsByDate, getHabitWeeklyProgress, getTodayHabitsWithStatus, logHabit, reorderHabits, toggleHabitToday, unarchiveHabit, updateHabit, useActiveHabits,
    useHabit, useHabitLogs,
    useHabitWeeklyProgress, useHabits, useTodayHabitsWithStatus
} from './queries/habitQueries'

// Stats queries
export {
    getCompletionHistory,
    getDailyActivity, getPlannerStats, getProductivityScore, useCompletionHistory, useDailyActivity, usePlannerStats
} from './queries/statsQueries'

// Re-export types for convenience
export type {
    CourseWithProgress, CourseWithUnits, DBCompletionRecord, DBCourse, DBLectureNoteMeta, DBPersonalTask, DBPlannerEvent, DBPlannerHabit,
    DBPlannerHabitLog, DBTask, DBUnit, EventDateRange, EventsByDate, PlannerEventType, PlannerFrequencyRule, PlannerFrequencyType, PlannerHabitType, TaskFilter, TaskStatus, UnitWithTasks
} from './types'

