/**
 * Tracker Module — Public API
 *
 * Time tracking modülünün dışa aktarım noktası.
 */

// Pages
export { ActivitiesPage } from './pages/ActivitiesPage'
export { CategoriesPage } from './pages/CategoriesPage'
export { GoalsPage } from './pages/GoalsPage'
export { RecordsPage } from './pages/RecordsPage'
export { StatsPage } from './pages/StatsPage'
export { TrackerPage } from './pages/TrackerPage'

// Components (Aşama 1)
export { ActivityCard } from './components/ActivityCard'
export { ActivityGrid } from './components/ActivityGrid'
export { RunningTimerBar } from './components/RunningTimerBar'
export { TimerControls } from './components/TimerControls'

// Components (Aşama 2)
export { RecordEditModal } from './components/RecordEditModal'
export { RecordItem } from './components/RecordItem'
export { RecordsFilter } from './components/RecordsFilter'
export type { RecordsFilterState } from './components/RecordsFilter'
export { RecordsGroupByDate } from './components/RecordsGroupByDate'

// Components (Aşama 3)
export { ActivityPieChart } from './components/ActivityPieChart'
export { DailyBarChart } from './components/DailyBarChart'
export { DateRangePicker } from './components/DateRangePicker'
export type { PeriodKey } from './components/DateRangePicker'
export { StatsSummaryCard } from './components/StatsSummaryCard'

// Components (Aşama 4)
export { GoalCard } from './components/GoalCard'
export { GoalEditModal } from './components/GoalEditModal'
export { GoalProgressBadge } from './components/GoalProgressBadge'

// Components (Aşama 5)
export { ActivityEditModal } from './components/ActivityEditModal'
export { CategoryEditModal } from './components/CategoryEditModal'

// Store (Aşama 1)
export { useTrackerUIStore } from './store/trackerUIStore'
export type { TrackerUIState } from './store/trackerUIStore'

// Business Logic (Aşama 1)
export { pauseTimer, resumeTimer, startTimer, stopTimer } from './lib/timerService'

// Business Logic (Aşama 6)
export { fireRules, createRule, updateRule, deleteRule } from './lib/ruleEngine'
export { getCurrentSuggestion, getHourlySuggestions } from './lib/suggestionEngine'
export type { ActivitySuggestion } from './lib/suggestionEngine'

// Business Logic (Aşama 7)
export {
    startTitleTimer,
    stopTitleTimer,
    requestNotificationPermission,
    sendNotification,
    notifyGoalNearing,
    notifyGoalCompleted,
    scheduleReminder,
} from './lib/notificationService'

// Business Logic (Aşama 8)
export { exportCSV, exportJSON, downloadCSV, downloadJSON } from './lib/exportService'
