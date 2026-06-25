import React, { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    Plus,
    Calendar,
    AlertTriangle,
    Eye,
    EyeOff,
    CheckSquare,
    AlertCircle,
    Bookmark,
    Flag,
    Folder
} from 'lucide-react'
import type { DBPersonalTask, TaskStatus } from '@/db/planner/types'
import { cn, formatDateDisplay } from '../../lib/utils'

// Mock collaborators to match the avatar aesthetic in the image
const MOCK_PEOPLE = [
    { name: 'Ahmet', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&auto=format&q=80' },
    { name: 'Bugra', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&auto=format&q=80' },
    { name: 'Elif', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&auto=format&q=80' },
    { name: 'Can', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&fit=crop&auto=format&q=80' }
]

interface KanbanBoardProps {
    tasks: DBPersonalTask[]
    onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>
    onSelectTask: (task: DBPersonalTask) => void
    onAddTaskInStatus: (status: TaskStatus) => void
}

const COLUMNS: { id: TaskStatus; label: string; color: string; icon: string }[] = [
    { id: 'blocked', label: 'Blocked', color: 'text-red-500 border-red-500/20 bg-red-500/5', icon: '🚨' },
    { id: 'planning', label: 'Planning', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5', icon: '📋' },
    { id: 'permits-awaited', label: 'Permits awaited', color: 'text-amber-500 border-amber-500/20 bg-amber-500/5', icon: '⏳' },
    { id: 'todo', label: 'To Do', color: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5', icon: '📝' },
    { id: 'in-progress', label: 'In Progress', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5', icon: '⚡' },
    { id: 'review', label: 'Review', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5', icon: '👁️' },
    { id: 'done', label: 'Done', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', icon: '✅' },
]

export function KanbanBoard({ tasks, onUpdateStatus, onSelectTask, onAddTaskInStatus }: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<DBPersonalTask | null>(null)
    const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('planex_kanban_collapsed')
            return saved ? JSON.parse(saved) : { review: true, todo: true }
        } catch {
            return { review: true, todo: true }
        }
    })

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        const task = tasks.find(t => t.id === active.id)
        if (task) {
            setActiveTask(task)
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const taskId = active.id as string
        const overId = over.id as string

        // Check if dropped over a column id
        const isColumn = COLUMNS.some(col => col.id === overId)
        let newStatus: TaskStatus | null = null

        if (isColumn) {
            newStatus = overId as TaskStatus
        } else {
            // Dropped over another card
            const overTask = tasks.find(t => t.id === overId)
            if (overTask) {
                newStatus = overTask.status
            }
        }

        if (newStatus) {
            const task = tasks.find(t => t.id === taskId)
            if (task && task.status !== newStatus) {
                await onUpdateStatus(taskId, newStatus)
            }
        }
    }

    const toggleColumn = (colId: string) => {
        setCollapsedColumns(prev => {
            const next = {
                ...prev,
                [colId]: !prev[colId]
            }
            try {
                localStorage.setItem('planex_kanban_collapsed', JSON.stringify(next))
            } catch (e) {
                console.warn('Failed to save kanban column preferences:', e)
            }
            return next
        })
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[60vh] items-start">
                {COLUMNS.map(column => {
                    const columnTasks = tasks.filter(t => t.status === column.id)
                    const isCollapsed = collapsedColumns[column.id]

                    return (
                        <div
                            key={column.id}
                            className={cn(
                                "flex flex-col rounded-xl border border-[var(--border-subtle)] bg-surface-100 transition-all duration-300 shrink-0",
                                isCollapsed ? "w-16" : "w-80"
                            )}
                        >
                            {/* Column Header */}
                            <div className={cn(
                                "flex items-center justify-between p-3 border-b border-[var(--border-subtle)]",
                                isCollapsed && "flex-col gap-4 py-4"
                            )}>
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg shrink-0">{column.icon}</span>
                                    {!isCollapsed && (
                                        <>
                                            <span className="font-semibold text-text-primary truncate text-sm">
                                                {column.label}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-300 text-text-muted font-bold shrink-0">
                                                {columnTasks.length}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {!isCollapsed && (
                                        <button
                                            onClick={() => onAddTaskInStatus(column.id)}
                                            className="p-1 hover:bg-surface-300 rounded text-text-secondary transition-colors"
                                            aria-label={`Add task to ${column.label}`}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toggleColumn(column.id)}
                                        className="p-1 hover:bg-surface-300 rounded text-text-muted transition-colors"
                                        aria-label={isCollapsed ? `Expand ${column.label} column` : `Collapse ${column.label} column`}
                                        aria-expanded={!isCollapsed}
                                    >
                                        {isCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Droppable Area */}
                            <DroppableContainer id={column.id} isCollapsed={isCollapsed}>
                                {!isCollapsed && (
                                    <div className="flex flex-col gap-3 p-3 min-h-[400px]">
                                        <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                            {columnTasks.map((task, idx) => (
                                                <SortableCard
                                                    key={task.id}
                                                    task={task}
                                                    index={idx}
                                                    onClick={() => onSelectTask(task)}
                                                />
                                            ))}
                                        </SortableContext>
                                        
                                        {/* Inline New work item button */}
                                        <button
                                            onClick={() => onAddTaskInStatus(column.id)}
                                            className="mt-2 py-2 px-3 border border-dashed border-[var(--border-medium)] rounded-xl text-xs text-text-muted hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center gap-1 bg-surface-50/50"
                                        >
                                            <Plus className="h-3 w-3" />
                                            <span>New work item</span>
                                        </button>
                                    </div>
                                )}
                            </DroppableContainer>
                        </div>
                    )
                })}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div className="w-72 opacity-90 rotate-2 pointer-events-none">
                        <CardBody task={activeTask} index={0} isDragging />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

// Droppable Wrapper
function DroppableContainer({ id, children, isCollapsed }: { id: string; children: React.ReactNode; isCollapsed: boolean }) {
    return (
        <div className={cn("w-full transition-all", isCollapsed && "h-0 overflow-hidden")}>
            {children}
        </div>
    )
}

// Sortable Card Wrapper
function SortableCard({ task, index, onClick }: { task: DBPersonalTask; index: number; onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id })

    const style = {
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
        opacity: isDragging ? 0.3 : 1
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick()
                }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Task: ${task.text}. Status: ${task.status}. Due Date: ${task.dueDateISO || 'None'}`}
            className="cursor-grab active:cursor-grabbing text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
        >
            <CardBody task={task} index={index} />
        </div>
    )
}

// Actual Task Card Body
function CardBody({ task, index, isDragging = false }: { task: DBPersonalTask; index: number; isDragging?: boolean }) {
    const taskCode = `PRO-${(index + 1) * 12 + 2}` // Simulated Task Code
    const assignees = task.assignees || [MOCK_PEOPLE[index % MOCK_PEOPLE.length].avatar]

    return (
        <div className={cn(
            "card hover-glow p-4 rounded-xl border border-[var(--border-subtle)] bg-surface-50 flex flex-col gap-3 relative transition-all",
            task.status === 'done' && 'opacity-60 line-through',
            isDragging && 'shadow-2xl border-primary'
        )}>
            {/* Top row: Code, category icons */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-text-muted">
                    <span className="p-0.5 rounded bg-surface-300/50">
                        {task.icon === 'flag' ? <Flag className="h-3 w-3 text-red-400" /> : 
                         task.icon === 'bookmark' ? <Bookmark className="h-3 w-3 text-blue-400" /> : 
                         <Folder className="h-3 w-3 text-indigo-400" />}
                    </span>
                    <span className="font-mono tracking-wider font-semibold text-[10px]">{taskCode}</span>
                </div>
                {task.isPriority && (
                    <span className="flex items-center gap-0.5 text-status-amber text-[10px] font-semibold bg-status-amber/10 px-1.5 py-0.5 rounded-full">
                        <AlertCircle className="h-2.5 w-2.5" />
                        Priority
                    </span>
                )}
            </div>

            {/* Title / Description */}
            <div className="space-y-1">
                <h4 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">{task.text}</h4>
                {task.note && (
                    <p className="text-xs text-text-muted line-clamp-1">{task.note}</p>
                )}
            </div>

            {/* Bottom Row: Due date, avatars */}
            <div className="flex items-center justify-between mt-1 border-t border-[var(--border-subtle)] pt-2.5 text-xs text-text-secondary">
                <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{task.dueDateISO ? formatDateDisplay(task.dueDateISO) : 'No due date'}</span>
                </div>
                
                {/* Avatars stacked */}
                <div className="flex -space-x-1.5 overflow-hidden">
                    {assignees.map((avatarUrl, idx) => (
                        <img
                            key={idx}
                            className="inline-block h-5.5 w-5.5 rounded-full ring-2 ring-surface-50 object-cover"
                            src={avatarUrl}
                            alt="Assignee avatar"
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
