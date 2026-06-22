export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

type TimestampRow = {
    created_at: string
    updated_at: string
}

type EpochRow = {
    created_at: number
    updated_at: number
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: TimestampRow & {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    occupation: string | null
                    student_status: 'student' | 'working' | 'both' | 'other'
                    school: string | null
                    department: string | null
                    grade: string | null
                    plan: 'free' | 'pro'
                    onboarding_completed: boolean
                    profile_completed: boolean
                    preferred_locale: string
                    preferred_theme: string
                }
                Insert: Partial<TimestampRow> & {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    occupation?: string | null
                    student_status?: 'student' | 'working' | 'both' | 'other'
                    school?: string | null
                    department?: string | null
                    grade?: string | null
                    plan?: 'free' | 'pro'
                    onboarding_completed?: boolean
                    profile_completed?: boolean
                    preferred_locale?: string
                    preferred_theme?: string
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    occupation?: string | null
                    student_status?: 'student' | 'working' | 'both' | 'other'
                    school?: string | null
                    department?: string | null
                    grade?: string | null
                    plan?: 'free' | 'pro'
                    onboarding_completed?: boolean
                    profile_completed?: boolean
                    preferred_locale?: string
                    preferred_theme?: string
                }
            }
            courses: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    name: string
                    code: string | null
                    icon: string | null
                    color: string
                    bg_gradient: string | null
                    instructor: string | null
                    credits: number | null
                    semester: string | null
                    archived: boolean
                    order_index: number
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    name: string
                    code?: string | null
                    icon?: string | null
                    color?: string
                    bg_gradient?: string | null
                    instructor?: string | null
                    credits?: number | null
                    semester?: string | null
                    archived?: boolean
                    order_index?: number
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    name?: string
                    code?: string | null
                    icon?: string | null
                    color?: string
                    bg_gradient?: string | null
                    instructor?: string | null
                    credits?: number | null
                    semester?: string | null
                    archived?: boolean
                    order_index?: number
                }
            }
            units: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    course_id: string
                    name: string
                    description: string | null
                    order_index: number
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    course_id: string
                    name: string
                    description?: string | null
                    order_index?: number
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    course_id?: string
                    name?: string
                    description?: string | null
                    order_index?: number
                }
            }
            tasks: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    course_id: string | null
                    unit_id: string | null
                    title: string
                    icon: string | null
                    description: string | null
                    completed: boolean
                    completed_at: string | null
                    due_date: string | null
                    priority: string | null
                    status: string
                    tags: Json
                    order_index: number
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    course_id?: string | null
                    unit_id?: string | null
                    title: string
                    icon?: string | null
                    description?: string | null
                    completed?: boolean
                    completed_at?: string | null
                    due_date?: string | null
                    priority?: string | null
                    status?: string
                    tags?: Json
                    order_index?: number
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    course_id?: string | null
                    unit_id?: string | null
                    title?: string
                    icon?: string | null
                    description?: string | null
                    completed?: boolean
                    completed_at?: string | null
                    due_date?: string | null
                    priority?: string | null
                    status?: string
                    tags?: Json
                    order_index?: number
                }
            }
            personal_tasks: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    title: string
                    icon: string | null
                    description: string | null
                    completed: boolean
                    completed_at: string | null
                    due_date: string | null
                    priority: string | null
                    status: string
                    order_index: number
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    title: string
                    icon?: string | null
                    description?: string | null
                    completed?: boolean
                    completed_at?: string | null
                    due_date?: string | null
                    priority?: string | null
                    status?: string
                    order_index?: number
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    title?: string
                    icon?: string | null
                    description?: string | null
                    completed?: boolean
                    completed_at?: string | null
                    due_date?: string | null
                    priority?: string | null
                    status?: string
                    order_index?: number
                }
            }
            events: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    course_id: string | null
                    title: string
                    description: string | null
                    type: string
                    date: string
                    location: string | null
                    color: string | null
                    completed: boolean
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    course_id?: string | null
                    title: string
                    description?: string | null
                    type: string
                    date: string
                    location?: string | null
                    color?: string | null
                    completed?: boolean
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    course_id?: string | null
                    title?: string
                    description?: string | null
                    type?: string
                    date?: string
                    location?: string | null
                    color?: string | null
                    completed?: boolean
                }
            }
            habits: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    emoji: string
                    icon: string | null
                    habit_type: string
                    target_value: number | null
                    target_unit: string | null
                    color: string
                    frequency: string
                    target_days: Json
                    archived: boolean
                    order_index: number
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    emoji?: string
                    icon?: string | null
                    habit_type?: string
                    target_value?: number | null
                    target_unit?: string | null
                    color?: string
                    frequency: string
                    target_days?: Json
                    archived?: boolean
                    order_index?: number
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    emoji?: string
                    icon?: string | null
                    habit_type?: string
                    target_value?: number | null
                    target_unit?: string | null
                    color?: string
                    frequency?: string
                    target_days?: Json
                    archived?: boolean
                    order_index?: number
                }
            }
            habit_logs: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    habit_id: string
                    date: string
                    status: string
                    value: number | null
                    notes: string | null
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    habit_id: string
                    date: string
                    status: string
                    value?: number | null
                    notes?: string | null
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    habit_id?: string
                    date?: string
                    status?: string
                    value?: number | null
                    notes?: string | null
                }
            }
            lecture_notes: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    course_id: string
                    title: string
                    file_name: string
                    file_size: number
                    file_type: string
                    storage_path: string
                    unit_title: string | null
                    upload_date: string
                    order_index: number
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    course_id: string
                    title: string
                    file_name: string
                    file_size: number
                    file_type: string
                    storage_path: string
                    unit_title?: string | null
                    upload_date?: string
                    order_index?: number
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    course_id?: string
                    title?: string
                    file_name?: string
                    file_size?: number
                    file_type?: string
                    storage_path?: string
                    unit_title?: string | null
                    upload_date?: string
                    order_index?: number
                }
            }
            categories: {
                Row: EpochRow & {
                    id: string
                    user_id: string
                    name: string
                    color: string
                    icon: string
                    archived: boolean
                }
                Insert: Partial<EpochRow> & {
                    id?: string
                    user_id: string
                    name: string
                    color: string
                    icon: string
                    archived?: boolean
                }
                Update: Partial<EpochRow> & {
                    id?: string
                    user_id?: string
                    name?: string
                    color?: string
                    icon?: string
                    archived?: boolean
                }
            }
            tags: {
                Row: EpochRow & {
                    id: string
                    user_id: string
                    name: string
                    color: string
                    group_id: string | null
                }
                Insert: Partial<EpochRow> & {
                    id?: string
                    user_id: string
                    name: string
                    color: string
                    group_id?: string | null
                }
                Update: Partial<EpochRow> & {
                    id?: string
                    user_id?: string
                    name?: string
                    color?: string
                    group_id?: string | null
                }
            }
            activities: {
                Row: EpochRow & {
                    id: string
                    user_id: string
                    category_id: string
                    name: string
                    color: string | null
                    icon: string | null
                    tag_ids: Json
                    archived: boolean
                    default_goal_ids: Json
                }
                Insert: Partial<EpochRow> & {
                    id?: string
                    user_id: string
                    category_id: string
                    name: string
                    color?: string | null
                    icon?: string | null
                    tag_ids?: Json
                    archived?: boolean
                    default_goal_ids?: Json
                }
                Update: Partial<EpochRow> & {
                    id?: string
                    user_id?: string
                    category_id?: string
                    name?: string
                    color?: string | null
                    icon?: string | null
                    tag_ids?: Json
                    archived?: boolean
                    default_goal_ids?: Json
                }
            }
            time_sessions: {
                Row: EpochRow & {
                    id: string
                    user_id: string
                    activity_id: string
                    start_at: number
                    end_at: number
                    duration_sec: number
                    note: string
                    date_key: string
                    merged_from_ids: Json
                }
                Insert: Partial<EpochRow> & {
                    id?: string
                    user_id: string
                    activity_id: string
                    start_at: number
                    end_at: number
                    duration_sec: number
                    note?: string
                    date_key: string
                    merged_from_ids?: Json
                }
                Update: Partial<EpochRow> & {
                    id?: string
                    user_id?: string
                    activity_id?: string
                    start_at?: number
                    end_at?: number
                    duration_sec?: number
                    note?: string
                    date_key?: string
                    merged_from_ids?: Json
                }
            }
            goals: {
                Row: EpochRow & {
                    id: string
                    user_id: string
                    name: string
                    scope: string
                    metric: string
                    min_target: number | null
                    max_target: number | null
                    target_value: number
                    activity_id: string | null
                    habit_id: string | null
                    enabled: boolean
                }
                Insert: Partial<EpochRow> & {
                    id?: string
                    user_id: string
                    name: string
                    scope: string
                    metric: string
                    min_target?: number | null
                    max_target?: number | null
                    target_value: number
                    activity_id?: string | null
                    habit_id?: string | null
                    enabled?: boolean
                }
                Update: Partial<EpochRow> & {
                    id?: string
                    user_id?: string
                    name?: string
                    scope?: string
                    metric?: string
                    min_target?: number | null
                    max_target?: number | null
                    target_value?: number
                    activity_id?: string | null
                    habit_id?: string | null
                    enabled?: boolean
                }
            }
            running_timers: {
                Row: {
                    id: string
                    user_id: string
                    activity_id: string
                    started_at: number
                    paused_at: number | null
                    accumulated_sec: number
                    mode: string
                    pomodoro_config_id: string | null
                    created_at: number
                }
                Insert: {
                    id?: string
                    user_id: string
                    activity_id: string
                    started_at: number
                    paused_at?: number | null
                    accumulated_sec?: number
                    mode?: string
                    pomodoro_config_id?: string | null
                    created_at: number
                }
                Update: {
                    id?: string
                    user_id?: string
                    activity_id?: string
                    started_at?: number
                    paused_at?: number | null
                    accumulated_sec?: number
                    mode?: string
                    pomodoro_config_id?: string | null
                    created_at?: number
                }
            }
            settings: {
                Row: TimestampRow & {
                    user_id: string
                    key: string
                    value: Json
                }
                Insert: Partial<TimestampRow> & {
                    user_id: string
                    key: string
                    value: Json
                }
                Update: Partial<TimestampRow> & {
                    user_id?: string
                    key?: string
                    value?: Json
                }
            }
            pomodoro_configs: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    name: string
                    work_duration: number
                    short_break_duration: number
                    long_break_duration: number
                    sessions_before_long_break: number
                    is_default: boolean
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    name: string
                    work_duration: number
                    short_break_duration: number
                    long_break_duration: number
                    sessions_before_long_break: number
                    is_default?: boolean
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    name?: string
                    work_duration?: number
                    short_break_duration?: number
                    long_break_duration?: number
                    sessions_before_long_break?: number
                    is_default?: boolean
                }
            }
            rules: {
                Row: EpochRow & {
                    id: string
                    user_id: string
                    name: string
                    trigger: string
                    conditions: Json
                    actions: Json
                    enabled: boolean
                }
                Insert: Partial<EpochRow> & {
                    id?: string
                    user_id: string
                    name: string
                    trigger: string
                    conditions?: Json
                    actions?: Json
                    enabled?: boolean
                }
                Update: Partial<EpochRow> & {
                    id?: string
                    user_id?: string
                    name?: string
                    trigger?: string
                    conditions?: Json
                    actions?: Json
                    enabled?: boolean
                }
            }
            reminders: {
                Row: EpochRow & {
                    id: string
                    user_id: string
                    kind: string
                    habit_id: string | null
                    activity_id: string | null
                    title: string
                    message: string
                    schedule: Json
                    enabled: boolean
                }
                Insert: Partial<EpochRow> & {
                    id?: string
                    user_id: string
                    kind: string
                    habit_id?: string | null
                    activity_id?: string | null
                    title: string
                    message: string
                    schedule: Json
                    enabled?: boolean
                }
                Update: Partial<EpochRow> & {
                    id?: string
                    user_id?: string
                    kind?: string
                    habit_id?: string | null
                    activity_id?: string | null
                    title?: string
                    message?: string
                    schedule?: Json
                    enabled?: boolean
                }
            }
            completion_records: {
                Row: TimestampRow & {
                    id: string
                    user_id: string
                    task_id: string
                    completed_at: string
                    date_key: string
                }
                Insert: Partial<TimestampRow> & {
                    id?: string
                    user_id: string
                    task_id: string
                    completed_at: string
                    date_key: string
                }
                Update: Partial<TimestampRow> & {
                    id?: string
                    user_id?: string
                    task_id?: string
                    completed_at?: string
                    date_key?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
