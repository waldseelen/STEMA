import React, { useMemo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
    Calendar,
    ArrowRight,
    CornerRightDown,
    Link as LinkIcon,
    Trash2,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
    Info,
    CheckCircle2,
    AlertCircle,
    Play,
    HelpCircle
} from 'lucide-react'
import type { DBPersonalTask, TaskStatus } from '@/db/planner/types'
import { updatePersonalTask } from '@/db/planner'
import { cn } from '../../lib/utils'

interface TimelineViewProps {
    tasks: DBPersonalTask[]
    onSelectTask: (task: DBPersonalTask) => void
}

export function TimelineView({ tasks, onSelectTask }: TimelineViewProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    // ── 1. States for Filters, Zoom, and Grouping ───────────────────────────
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'priority'>('all')
    const [groupBy, setGroupBy] = useState<'none' | 'status' | 'priority'>('none')
    const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('day')

    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
    const [connections, setConnections] = useState<{ id: string; path: string; color: string; isCritical: boolean }[]>([])

    // Drag and drop / Resize state
    const [activeDrag, setActiveDrag] = useState<{
        taskId: string
        type: 'move' | 'resize-start' | 'resize-end'
        startX: number
        startCol: number
        endCol: number
    } | null>(null)
    const [dragPixelOffset, setDragPixelOffset] = useState<number>(0)

    // Interactive Dependency Drawing State
    const [activeLinkSourceId, setActiveLinkSourceId] = useState<string | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    // Hover tooltip state
    const [hoveredTask, setHoveredTask] = useState<DBPersonalTask | null>(null)
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

    // ── 2. Dynamic Date Range Generation ──────────────────────────────────────
    const { startDate, endDate, daysArray, columnsCount } = useMemo(() => {
        let minDate: Date | null = null
        let maxDate: Date | null = null

        tasks.forEach(t => {
            if (t.startDateISO) {
                const d = new Date(t.startDateISO)
                if (!isNaN(d.getTime())) {
                    if (!minDate || d < minDate) minDate = d
                }
            }
            if (t.dueDateISO) {
                const d = new Date(t.dueDateISO)
                if (!isNaN(d.getTime())) {
                    if (!maxDate || d > maxDate) maxDate = d
                }
            }
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Sensible fallbacks
        if (!minDate) {
            minDate = new Date(today)
            minDate.setDate(today.getDate() - 5)
        } else {
            minDate = new Date(minDate)
            minDate.setDate(minDate.getDate() - 3)
        }

        if (!maxDate) {
            maxDate = new Date(today)
            maxDate.setDate(today.getDate() + 15)
        } else {
            maxDate = new Date(maxDate)
            maxDate.setDate(maxDate.getDate() + 5)
        }

        // Enforce a minimum calendar width of 14 days
        const diffTime = Math.abs(maxDate.getTime() - minDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays < 14) {
            maxDate = new Date(minDate)
            maxDate.setDate(minDate.getDate() + 14)
        }

        const days: Date[] = []
        const cur = new Date(minDate)
        while (cur <= maxDate) {
            days.push(new Date(cur))
            cur.setDate(cur.getDate() + 1)
        }

        return {
            startDate: minDate,
            endDate: maxDate,
            daysArray: days,
            columnsCount: days.length
        }
    }, [tasks])

    // Scale columns width based on zoom resolution
    const columnWidth = zoom === 'day' ? 72 : zoom === 'week' ? 32 : 12

    // Convert Date to Column Index (1-indexed for CSS Grid)
    const getColRange = (startISO: string, endISO: string) => {
        const start = new Date(startISO)
        const end = new Date(endISO)

        let startIdx = daysArray.findIndex(d => d.toDateString() === start.toDateString())
        let endIdx = daysArray.findIndex(d => d.toDateString() === end.toDateString())

        if (startIdx === -1) startIdx = 0
        if (endIdx === -1) endIdx = daysArray.length - 1

        return {
            startCol: startIdx + 1,
            endCol: Math.max(startIdx + 2, endIdx + 2) // Grid end is exclusive
        }
    }

    // Convert Column Index back to Date strings
    const getDatesFromCols = (startCol: number, endCol: number) => {
        const startIdx = Math.max(0, Math.min(daysArray.length - 1, startCol - 1))
        const endIdx = Math.max(0, Math.min(daysArray.length - 1, endCol - 2))

        return {
            startDateISO: daysArray[startIdx].toISOString().split('T')[0],
            dueDateISO: daysArray[endIdx].toISOString().split('T')[0]
        }
    }

    // ── 3. Calendar Header Spans ─────────────────────────────────────────────
    const headers = useMemo(() => {
        const monthHeaders: { label: string; startIdx: number; span: number }[] = []
        const weekHeaders: { label: string; startIdx: number; span: number }[] = []

        daysArray.forEach((date, idx) => {
            const mLabel = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
            if (monthHeaders.length === 0 || monthHeaders[monthHeaders.length - 1].label !== mLabel) {
                if (monthHeaders.length > 0) {
                    monthHeaders[monthHeaders.length - 1].span = idx - monthHeaders[monthHeaders.length - 1].startIdx
                }
                monthHeaders.push({ label: mLabel, startIdx: idx, span: 1 })
            } else {
                monthHeaders[monthHeaders.length - 1].span++
            }

            const startOfYear = new Date(date.getFullYear(), 0, 1)
            const pastDays = (date.getTime() - startOfYear.getTime()) / 86400000
            const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7)
            const wLabel = zoom === 'month' ? `H.${weekNum}` : `Hafta ${weekNum}`

            if (weekHeaders.length === 0 || weekHeaders[weekHeaders.length - 1].label !== wLabel) {
                if (weekHeaders.length > 0) {
                    weekHeaders[weekHeaders.length - 1].span = idx - weekHeaders[weekHeaders.length - 1].startIdx
                }
                weekHeaders.push({ label: wLabel, startIdx: idx, span: 1 })
            } else {
                weekHeaders[weekHeaders.length - 1].span++
            }
        })

        if (monthHeaders.length > 0) {
            monthHeaders[monthHeaders.length - 1].span = daysArray.length - monthHeaders[monthHeaders.length - 1].startIdx
        }
        if (weekHeaders.length > 0) {
            weekHeaders[weekHeaders.length - 1].span = daysArray.length - weekHeaders[weekHeaders.length - 1].startIdx
        }

        return { monthHeaders, weekHeaders }
    }, [daysArray, zoom])

    // ── 4. Apply Filters & Pre-Process Tasks ─────────────────────────────────
    const processedTasks = useMemo(() => {
        return tasks.map((task, idx) => {
            const dueDate = task.dueDateISO || '2026-06-30'
            let start = task.startDateISO
            if (!start) {
                const d = new Date(dueDate)
                d.setDate(d.getDate() - 3)
                start = d.toISOString().split('T')[0]
            }
            return {
                ...task,
                startDateISO: start,
                dueDateISO: dueDate,
                dependencies: task.dependencies || []
            }
        })
    }, [tasks])

    // Filter tasks based on Search, Status, and Priority
    const filteredTasks = useMemo(() => {
        return processedTasks.filter(t => {
            const matchesSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter
            const matchesPriority = priorityFilter === 'all' || t.isPriority
            return matchesSearch && matchesStatus && matchesPriority
        })
    }, [processedTasks, searchQuery, statusFilter, priorityFilter])

    // ── 5. Critical Path Calculation (DAG Longest Path) ──────────────────────
    const criticalPathIds = useMemo(() => {
        const adj: Record<string, string[]> = {}
        const indegree: Record<string, number> = {}
        const tasksMap: Record<string, typeof processedTasks[0]> = {}

        processedTasks.forEach(t => {
            tasksMap[t.id] = t
            adj[t.id] = []
            indegree[t.id] = 0
        })

        processedTasks.forEach(t => {
            t.dependencies.forEach(depId => {
                if (adj[depId]) {
                    adj[depId].push(t.id)
                    indegree[t.id]++
                }
            })
        })

        const getDuration = (t: typeof processedTasks[0]) => {
            const s = new Date(t.startDateISO)
            const d = new Date(t.dueDateISO)
            const diff = d.getTime() - s.getTime()
            return Math.max(1, Math.ceil(diff / 86400000))
        }

        const memo: Record<string, { length: number; path: string[] }> = {}
        const findLongestPathFrom = (id: string): { length: number; path: string[] } => {
            if (memo[id]) return memo[id]
            const task = tasksMap[id]
            if (!task) return { length: 0, path: [] }

            const dur = getDuration(task)
            let maxSubLength = 0
            let maxSubPath: string[] = []

            adj[id].forEach(nextId => {
                const sub = findLongestPathFrom(nextId)
                if (sub.length > maxSubLength) {
                    maxSubLength = sub.length
                    maxSubPath = sub.path
                }
            })

            const res = {
                length: dur + maxSubLength,
                path: [id, ...maxSubPath]
            }
            memo[id] = res
            return res
        }

        let maxLength = 0
        let criticalPath: string[] = []
        processedTasks.forEach(t => {
            if (indegree[t.id] === 0) {
                const res = findLongestPathFrom(t.id)
                if (res.length > maxLength) {
                    maxLength = res.length
                    criticalPath = res.path
                }
            }
        })

        // Highlight critical path only if it contains actual dependencies
        const hasDependencies = processedTasks.some(t => t.dependencies.length > 0)
        return hasDependencies ? new Set(criticalPath) : new Set<string>()
    }, [processedTasks])

    // ── 6. Grouping and Row Packing ──────────────────────────────────────────
    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            // Row packing algorithm to prevent task overlap on same row
            const sorted = [...filteredTasks].sort((a, b) => a.startDateISO.localeCompare(b.startDateISO))
            const packedRows: (typeof filteredTasks[0])[][] = []

            sorted.forEach(task => {
                const tStart = new Date(task.startDateISO)
                const tEnd = new Date(task.dueDateISO)

                let placed = false
                for (let r = 0; r < packedRows.length; r++) {
                    const overlap = packedRows[r].some(existing => {
                        const exStart = new Date(existing.startDateISO)
                        const exEnd = new Date(existing.dueDateISO)
                        return tStart < exEnd && tEnd > exStart
                    })
                    if (!overlap) {
                        packedRows[r].push(task)
                        placed = true
                        break
                    }
                }
                if (!placed) {
                    packedRows.push([task])
                }
            })

            return [{ id: 'all', title: 'Tüm Görevler', rows: packedRows }]
        }

        // Group by Status or Priority
        const groups: Record<string, typeof filteredTasks> = {}

        filteredTasks.forEach(t => {
            let key = ''
            if (groupBy === 'status') {
                key = t.status
            } else if (groupBy === 'priority') {
                key = t.isPriority ? 'Öncelikli' : 'Normal'
            }

            if (!groups[key]) groups[key] = []
            groups[key].push(t)
        })

        return Object.entries(groups).map(([key, list]) => {
            // Within each group, list each task in its own row for readability
            const rows = list.map(item => [item])
            let title = key
            if (groupBy === 'status') {
                const labels: Record<string, string> = {
                    todo: 'Yapılacak',
                    'in-progress': 'Devam Ediyor',
                    blocked: 'Engelleyici Var',
                    done: 'Tamamlandı'
                }
                title = labels[key] || key
            }
            return { id: key, title, rows }
        })
    }, [filteredTasks, groupBy])

    // ── 7. Render Dependency Connections ──────────────────────────────────────
    useLayoutEffect(() => {
        const calculateConnections = () => {
            if (!containerRef.current) return
            const containerRect = containerRef.current.getBoundingClientRect()
            const newConnections: typeof connections = []

            filteredTasks.forEach(task => {
                task.dependencies.forEach(depId => {
                    const sourceEl = document.getElementById(`timeline-bar-${depId}`)
                    const targetEl = document.getElementById(`timeline-bar-${task.id}`)

                    if (sourceEl && targetEl) {
                        const sourceRect = sourceEl.getBoundingClientRect()
                        const targetRect = targetEl.getBoundingClientRect()

                        const x1 = sourceRect.right - containerRect.left + containerRef.current!.scrollLeft
                        const y1 = sourceRect.top - containerRect.top + sourceRect.height / 2 + containerRef.current!.scrollTop

                        const x2 = targetRect.left - containerRect.left + containerRef.current!.scrollLeft
                        const y2 = targetRect.top - containerRect.top + targetRect.height / 2 + containerRef.current!.scrollTop

                        const dx = Math.abs(x2 - x1) * 0.5
                        const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`

                        const isCritical = criticalPathIds.has(depId) && criticalPathIds.has(task.id)
                        let color = '#818cf8' // default indigo-400
                        if (isCritical) {
                            color = '#f43f5e' // critical path is rose-500
                        } else if (task.status === 'blocked') {
                            color = '#fda4af' // blocked is rose-300
                        }

                        newConnections.push({
                            id: `${depId}-${task.id}`,
                            path,
                            color,
                            isCritical
                        })
                    }
                })
            })

            setConnections(newConnections)
        }

        const timer = setTimeout(calculateConnections, 100)

        let resizeObserver: ResizeObserver | null = null
        if (containerRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => calculateConnections())
            resizeObserver.observe(containerRef.current)
        }

        window.addEventListener('resize', calculateConnections)
        return () => {
            clearTimeout(timer)
            if (resizeObserver) resizeObserver.disconnect()
            window.removeEventListener('resize', calculateConnections)
        }
    }, [filteredTasks, groupedData, collapsedGroups, zoom, criticalPathIds])

    // Live mouse tracker for drawing connections
    useEffect(() => {
        if (!activeLinkSourceId) return
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            setMousePos({
                x: e.clientX - rect.left + containerRef.current.scrollLeft,
                y: e.clientY - rect.top + containerRef.current.scrollTop
            })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [activeLinkSourceId])

    // ── 8. Drag and Resize Handlers ──────────────────────────────────────────
    const handleBarPointerDown = (
        e: React.PointerEvent<HTMLDivElement>,
        task: typeof processedTasks[0]
    ) => {
        if (activeLinkSourceId) {
            e.stopPropagation()
            handleConnectClick(task.id)
            return
        }

        e.stopPropagation()
        e.currentTarget.setPointerCapture(e.pointerId)

        const rect = e.currentTarget.getBoundingClientRect()
        const offsetX = e.clientX - rect.left

        let type: 'move' | 'resize-start' | 'resize-end' = 'move'
        if (task.status !== 'done') {
            if (offsetX < 16) {
                type = 'resize-start'
            } else if (rect.width - offsetX < 16) {
                type = 'resize-end'
            }
        }

        const { startCol, endCol } = getColRange(task.startDateISO, task.dueDateISO)
        setActiveDrag({
            taskId: task.id,
            type,
            startX: e.clientX,
            startCol,
            endCol
        })
        setDragPixelOffset(0)
    }

    const handleBarPointerMoveHover = (
        e: React.PointerEvent<HTMLDivElement>,
        task: typeof processedTasks[0]
    ) => {
        if (activeDrag) return
        
        const rect = e.currentTarget.getBoundingClientRect()
        const offsetX = e.clientX - rect.left

        if (task.status !== 'done' && (offsetX < 16 || rect.width - offsetX < 16)) {
            e.currentTarget.style.cursor = 'col-resize'
        } else {
            e.currentTarget.style.cursor = 'grab'
        }
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!activeDrag) return
        e.stopPropagation()
        setDragPixelOffset(e.clientX - activeDrag.startX)

        // Google Calendar-style auto scroll near container edges
        if (containerRef.current) {
            const container = containerRef.current
            const containerRect = container.getBoundingClientRect()
            const mouseX = e.clientX - containerRect.left
            const scrollSpeed = 12
            const threshold = 60

            if (mouseX < threshold) {
                container.scrollLeft -= scrollSpeed
            } else if (containerRect.width - mouseX < threshold) {
                container.scrollLeft += scrollSpeed
            }
        }
    }

    const handlePointerUp = async (e: React.PointerEvent) => {
        if (!activeDrag) return
        e.stopPropagation()
        e.currentTarget.releasePointerCapture(e.pointerId)

        const deltaDays = Math.round(dragPixelOffset / columnWidth)

        let finalStart = activeDrag.startCol
        let finalEnd = activeDrag.endCol

        if (activeDrag.type === 'move') {
            finalStart += deltaDays
            finalEnd += deltaDays
        } else if (activeDrag.type === 'resize-start') {
            const maxDelta = activeDrag.endCol - activeDrag.startCol - 2
            finalStart += Math.min(deltaDays, maxDelta)
        } else if (activeDrag.type === 'resize-end') {
            const minDelta = -(activeDrag.endCol - activeDrag.startCol - 2)
            finalEnd += Math.max(deltaDays, minDelta)
        }

        const { startDateISO, dueDateISO } = getDatesFromCols(finalStart, finalEnd)

        try {
            await updatePersonalTask(activeDrag.taskId, {
                startDateISO,
                dueDateISO
            })
        } catch (err) {
            console.error('Tarih güncellenirken hata oluştu:', err)
        } finally {
            setActiveDrag(null)
            setDragPixelOffset(0)
        }
    }

    // Connect dependency
    const handleConnectClick = async (targetId: string) => {
        if (!activeLinkSourceId || activeLinkSourceId === targetId) return
        const targetTask = processedTasks.find(t => t.id === targetId)
        if (!targetTask) return

        if (!targetTask.dependencies.includes(activeLinkSourceId)) {
            const updatedDeps = [...targetTask.dependencies, activeLinkSourceId]
            try {
                await updatePersonalTask(targetId, { dependencies: updatedDeps })
            } catch (err) {
                console.error('Bağlantı eklenirken hata oluştu:', err)
            }
        }
        setActiveLinkSourceId(null)
    }

    // Delete dependency on connection click
    const handleConnectionClick = async (connId: string) => {
        const [depId, taskId] = connId.split('-')
        const targetTask = processedTasks.find(t => t.id === taskId)
        if (!targetTask) return

        if (window.confirm('Bu bağımlılık ilişkisini silmek istediğinize emin misiniz?')) {
            const updatedDeps = targetTask.dependencies.filter(id => id !== depId)
            try {
                await updatePersonalTask(taskId, { dependencies: updatedDeps })
            } catch (err) {
                console.error('Bağlantı silinirken hata oluştu:', err)
            }
        }
    }

    // ── 9. Hover Card Positioner ─────────────────────────────────────────────
    const handleBarPointerOver = (e: React.PointerEvent, task: DBPersonalTask) => {
        setHoveredTask(task)
    }

    const handleBarPointerMove = (e: React.PointerEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setTooltipPos({
            x: e.clientX - rect.left + 15,
            y: e.clientY - rect.top + 15
        })
    }

    const handleBarPointerOut = () => {
        setHoveredTask(null)
    }

    return (
        <div className="card border border-[var(--border-subtle)] bg-surface-100 p-5 rounded-2xl flex flex-col gap-4 relative select-none shadow-md">
            
            {/* ── Filter & Options Toolbar ────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-50 p-3 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Görev ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-surface-100 text-xs focus:ring-1 focus:ring-primary focus:outline-none w-48 text-text-primary placeholder:text-text-muted"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <Filter className="h-3.5 w-3.5 text-text-muted" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as any)}
                            className="bg-surface-100 border border-[var(--border-subtle)] rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
                        >
                            <option value="all">Tüm Durumlar</option>
                            <option value="todo">Yapılacak</option>
                            <option value="in-progress">Devam Ediyor</option>
                            <option value="blocked">Engelleyici Var</option>
                            <option value="done">Tamamlandı</option>
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <select
                        value={priorityFilter}
                        onChange={e => setPriorityFilter(e.target.value as any)}
                        className="bg-surface-100 border border-[var(--border-subtle)] rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
                    >
                        <option value="all">Tüm Öncelikler</option>
                        <option value="priority">Yalnızca Öncelikli</option>
                    </select>

                    {/* Group By */}
                    <div className="flex items-center gap-1 text-xs">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-text-muted" />
                        <select
                            value={groupBy}
                            onChange={e => setGroupBy(e.target.value as any)}
                            className="bg-surface-100 border border-[var(--border-subtle)] rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
                        >
                            <option value="none">Gruplama Yok (Sıkıştırılmış)</option>
                            <option value="status">Duruma Göre Grupla</option>
                            <option value="priority">Önceliğe Göre Grupla</option>
                        </select>
                    </div>
                </div>

                {/* Zoom Controller */}
                <div className="flex items-center gap-1.5 bg-surface-100 p-1 border border-[var(--border-subtle)] rounded-lg">
                    {(['day', 'week', 'month'] as const).map(scale => (
                        <button
                            key={scale}
                            onClick={() => setZoom(scale)}
                            className={cn(
                                "px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-all",
                                zoom === scale
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            {scale === 'day' ? 'Gün' : scale === 'week' ? 'Hafta' : 'Ay'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hint bar */}
            <div className="flex items-center justify-between text-[11px] text-text-muted px-1">
                <span className="flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 text-blue-400" />
                    Çubuğu sürükleyerek taşıyın; sağ/sol uçlardan uzatın.
                    {activeLinkSourceId ? (
                        <span className="text-primary font-bold animate-pulse ml-2">Bağlantı modu aktif. Hedef göreve tıklayın.</span>
                    ) : (
                        " Zincir simgesine tıklayıp başka bir göreve sürükleyerek bağımlılık yaratın."
                    )}
                </span>
                <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Kritik Yol</span>
                    <span className="font-mono">Çizgilere tıklayarak bağımlılıkları silebilirsiniz.</span>
                </span>
            </div>

            {/* ── Timeline Display Window ─────────────────────────────────────── */}
            <div 
                ref={containerRef} 
                className="overflow-x-auto relative min-h-[420px] border border-[var(--border-subtle)] rounded-xl bg-surface-50 custom-scrollbar scroll-smooth"
            >
                {/* SVG Connections Overlay */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                    <defs>
                        <marker
                            id="arrow-indigo"
                            viewBox="0 0 10 10"
                            refX="7"
                            refY="5"
                            markerWidth="5"
                            markerHeight="5"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
                        </marker>
                        <marker
                            id="arrow-critical"
                            viewBox="0 0 10 10"
                            refX="7"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                        </marker>
                    </defs>

                    {/* Render static computed lines */}
                    {connections.map(conn => (
                        <path
                            key={conn.id}
                            d={conn.path}
                            stroke={conn.color}
                            strokeWidth={conn.isCritical ? "2.5" : "1.8"}
                            strokeDasharray={conn.isCritical ? "" : "3 3"}
                            fill="none"
                            markerEnd={conn.isCritical ? "url(#arrow-critical)" : "url(#arrow-indigo)"}
                            className={cn(
                                "pointer-events-auto cursor-pointer transition-all duration-200",
                                conn.isCritical ? "hover:stroke-red-700 hover:stroke-[3.5px]" : "hover:stroke-red-400 hover:stroke-[2.5px]"
                            )}
                            onClick={() => handleConnectionClick(conn.id)}
                        />
                    ))}

                    {/* Active dynamic linking path */}
                    {activeLinkSourceId && (() => {
                        const sourceEl = document.getElementById(`timeline-bar-${activeLinkSourceId}`)
                        if (!sourceEl || !containerRef.current) return null
                        const rect = sourceEl.getBoundingClientRect()
                        const containerRect = containerRef.current.getBoundingClientRect()
                        const x1 = rect.right - containerRect.left + containerRef.current.scrollLeft
                        const y1 = rect.top - containerRect.top + rect.height / 2 + containerRef.current.scrollTop
                        return (
                            <path
                                d={`M ${x1} ${y1} L ${mousePos.x} ${mousePos.y}`}
                                stroke="#6366f1"
                                strokeWidth="2"
                                strokeDasharray="5 5"
                                fill="none"
                            />
                        )
                    })()}
                </svg>

                {/* Grid Structure */}
                <div 
                    className="relative grid" 
                    style={{ 
                        width: `${columnsCount * columnWidth}px`,
                        gridTemplateColumns: `repeat(${columnsCount}, minmax(${columnWidth}px, 1fr))` 
                    }}
                >
                    {/* Top Month Header Row */}
                    {headers.monthHeaders.map(m => (
                        <div
                            key={m.label}
                            style={{
                                gridColumnStart: m.startIdx + 1,
                                gridColumnEnd: m.startIdx + 1 + m.span
                            }}
                            className="py-2.5 px-3 border-b border-r border-[var(--border-subtle)] font-bold text-text-primary text-xs bg-surface-100 sticky top-0 z-40 truncate"
                        >
                            {m.label}
                        </div>
                    ))}

                    {/* Secondary Weeks Header Row */}
                    {headers.weekHeaders.map(w => (
                        <div
                            key={w.label}
                            style={{
                                gridColumnStart: w.startIdx + 1,
                                gridColumnEnd: w.startIdx + 1 + w.span
                            }}
                            className="py-1 px-3 border-b border-r border-[var(--border-subtle)] text-[10px] font-semibold text-text-muted bg-surface-50 truncate"
                        >
                            {w.label}
                        </div>
                    ))}

                    {/* Days row */}
                    {zoom !== 'month' && daysArray.map((date, idx) => {
                        const isToday = date.toDateString() === new Date().toDateString()
                        const dayNum = date.getDate()
                        const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' }).slice(0, 2)

                        return (
                            <div
                                key={date.toISOString()}
                                className={cn(
                                    "flex flex-col items-center justify-center py-1.5 border-b border-r border-[var(--border-subtle)] text-[9px] font-mono",
                                    isToday ? "bg-blue-500/10 border-b-blue-500" : "text-text-muted"
                                )}
                            >
                                {zoom === 'day' && <span>{dayName}</span>}
                                <span className={cn(
                                    "h-4 w-4 flex items-center justify-center rounded-full font-bold",
                                    isToday ? "bg-blue-500 text-white" : "text-text-primary",
                                    zoom === 'week' && "text-[9px]"
                                )}>
                                    {dayNum}
                                </span>
                            </div>
                        )
                    })}

                    {/* Today Blue Line Overlay */}
                    {(() => {
                        const todayIdx = daysArray.findIndex(d => d.toDateString() === new Date().toDateString())
                        if (todayIdx === -1) return null
                        return (
                            <div
                                className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-20 pointer-events-none"
                                style={{
                                    left: `${(todayIdx + 0.5) * columnWidth}px`
                                }}
                            />
                        )
                    })()}

                    {/* ── Groups and Task Bars ─────────────────────────────────── */}
                    <div className="col-span-full py-4 space-y-6">
                        {groupedData.map(group => {
                            const isCollapsed = collapsedGroups[group.id] || false
                            return (
                                <div key={group.id} className="space-y-3">
                                    {/* Group Header */}
                                    {groupBy !== 'none' && (
                                        <button
                                            onClick={() => setCollapsedGroups(prev => ({ ...prev, [group.id]: !isCollapsed }))}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-surface-200 border border-[var(--border-subtle)] hover:bg-surface-300 rounded-lg text-xs font-bold text-text-primary transition-all sticky left-3 z-30"
                                        >
                                            {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                                            {group.title} ({group.rows.flat().length})
                                        </button>
                                    )}

                                    {/* Group Rows */}
                                    {!isCollapsed && (
                                        <div className="space-y-4">
                                            {group.rows.map((row, rIdx) => (
                                                <div
                                                    key={rIdx}
                                                    className="relative h-9 w-full grid"
                                                    style={{
                                                        gridTemplateColumns: `repeat(${columnsCount}, minmax(${columnWidth}px, 1fr))`
                                                    }}
                                                >
                                                    {/* Background grid lines */}
                                                    <div className="absolute inset-0 grid pointer-events-none col-span-full" style={{ gridTemplateColumns: `repeat(${columnsCount}, minmax(${columnWidth}px, 1fr))` }}>
                                                        {Array.from({ length: columnsCount }).map((_, idx) => {
                                                            const isWeekEnd = (idx + 1) % 7 === 0
                                                            const shouldDraw = zoom !== 'month' || isWeekEnd
                                                            if (!shouldDraw) return <div key={idx} />
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={cn(
                                                                        "h-full border-r",
                                                                        isWeekEnd
                                                                            ? "border-[var(--border-subtle)]/35"
                                                                            : "border-[var(--border-subtle)]/15"
                                                                    )}
                                                                />
                                                            )
                                                        })}
                                                    </div>

                                                    {row.map(task => {
                                                        const { startCol, endCol } = getColRange(task.startDateISO, task.dueDateISO)

                                                        const isThisDragging = activeDrag?.taskId === task.id
                                                        let renderedStart = startCol
                                                        let renderedEnd = endCol

                                                        let inlineStyle: React.CSSProperties = {
                                                            gridColumnStart: startCol,
                                                            gridColumnEnd: endCol,
                                                            touchAction: 'none',
                                                        }

                                                        if (isThisDragging && dragPixelOffset !== 0) {
                                                            const deltaDays = Math.round(dragPixelOffset / columnWidth)

                                                            if (activeDrag.type === 'move') {
                                                                renderedStart = startCol + deltaDays
                                                                renderedEnd = endCol + deltaDays
                                                                inlineStyle = {
                                                                    ...inlineStyle,
                                                                    transform: `translate3d(${dragPixelOffset}px, 0, 0)`,
                                                                    zIndex: 50,
                                                                }
                                                            } else if (activeDrag.type === 'resize-start') {
                                                                const maxDelta = endCol - startCol - 2
                                                                const clampedDeltaDays = Math.min(deltaDays, maxDelta)
                                                                renderedStart = startCol + clampedDeltaDays

                                                                const maxDeltaX = maxDelta * columnWidth
                                                                const clampedDeltaX = Math.min(dragPixelOffset, maxDeltaX)
                                                                inlineStyle = {
                                                                    ...inlineStyle,
                                                                    transform: `translate3d(${clampedDeltaX}px, 0, 0)`,
                                                                    width: `calc(100% - ${clampedDeltaX}px)`,
                                                                    zIndex: 50,
                                                                }
                                                            } else if (activeDrag.type === 'resize-end') {
                                                                const minDelta = -(endCol - startCol - 2)
                                                                const clampedDeltaDays = Math.max(deltaDays, minDelta)
                                                                renderedEnd = endCol + clampedDeltaDays

                                                                const minDeltaX = minDelta * columnWidth
                                                                const clampedDeltaX = Math.max(dragPixelOffset, minDeltaX)
                                                                inlineStyle = {
                                                                    ...inlineStyle,
                                                                    width: `calc(100% + ${clampedDeltaX}px)`,
                                                                    zIndex: 50,
                                                                }
                                                            }
                                                        }

                                                        // Style mapping based on status and priority
                                                        const isDone = task.status === 'done'
                                                        const isBlocked = task.status === 'blocked'
                                                        const isCritical = criticalPathIds.has(task.id)
                                                        const barStyles = cn(
                                                            task.status === 'done'
                                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                                                : task.status === 'blocked'
                                                                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                                                                : task.status === 'in-progress'
                                                                ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400"
                                                                : "bg-surface-200 border-[var(--border-subtle)] text-text-primary"
                                                        )

                                                        return (
                                                            <React.Fragment key={task.id}>
                                                                {/* Snap Preview Ghost */}
                                                                {isThisDragging && dragPixelOffset !== 0 && (
                                                                    <div
                                                                        style={{
                                                                            gridColumnStart: Math.max(1, renderedStart),
                                                                            gridColumnEnd: Math.min(columnsCount + 2, renderedEnd),
                                                                        }}
                                                                        className="h-full border-2 border-dashed border-primary/40 bg-primary/5 rounded-full z-20 pointer-events-none"
                                                                    />
                                                                )}

                                                                <div
                                                                    id={`timeline-bar-${task.id}`}
                                                                    style={inlineStyle}
                                                                    onPointerDown={(e) => handleBarPointerDown(e, task)}
                                                                    onPointerMove={(e) => {
                                                                        if (activeDrag) {
                                                                            handlePointerMove(e)
                                                                        } else {
                                                                            handleBarPointerMoveHover(e, task)
                                                                        }
                                                                    }}
                                                                    onPointerUp={handlePointerUp}
                                                                    onPointerOver={(e) => handleBarPointerOver(e, task)}
                                                                    onPointerMoveCapture={handleBarPointerMove}
                                                                    onPointerOut={handleBarPointerOut}
                                                                    tabIndex={0}
                                                                    role="button"
                                                                    aria-label={`Task: ${task.text}. Starts ${task.startDateISO}, due ${task.dueDateISO}.${isCritical ? ' On critical path.' : ''}`}
                                                                    className={cn(
                                                                        "absolute top-0 bottom-0 flex items-center justify-between px-3.5 border rounded-full text-xs font-semibold select-none z-30 transition-shadow duration-150 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm pointer-events-auto touch-none group",
                                                                        barStyles,
                                                                        isCritical && "border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] border-[1.5px]",
                                                                        task.isPriority && !isCritical && "border-amber-500 border-dashed border-[1.5px]",
                                                                        isThisDragging && "cursor-grabbing shadow-lg"
                                                                    )}
                                                                >
                                                                    {/* Left Visual Grip Affordance */}
                                                                    {task.status !== 'done' && (
                                                                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-30 select-none pointer-events-none w-1 items-center shrink-0">
                                                                            <div className="h-1 w-[2px] bg-current rounded-full" />
                                                                            <div className="h-1 w-[2px] bg-current rounded-full" />
                                                                        </div>
                                                                    )}

                                                                    {/* Task Icon / Status Indicator */}
                                                                    <div className="flex items-center gap-1.5 truncate pointer-events-none pl-1 pb-[1px]">
                                                                        {isDone ? (
                                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                                        ) : isBlocked ? (
                                                                            <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                                                        ) : task.isPriority ? (
                                                                            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                                                                        ) : null}
                                                                        <span className="truncate pr-1">{task.text}</span>
                                                                    </div>

                                                                    {/* Link & Details Buttons (visible on hover) */}
                                                                    <div className="flex items-center gap-1 shrink-0 pr-1">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                setActiveLinkSourceId(task.id)
                                                                            }}
                                                                            className="p-1 hover:bg-black/10 rounded-full text-text-muted hover:text-text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 timeline-action-btn"
                                                                            title="Bağımlılık Ok Oluştur"
                                                                        >
                                                                            <LinkIcon className="h-3 w-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                onSelectTask(task)
                                                                            }}
                                                                            className="p-1 hover:bg-black/10 rounded-full text-text-muted hover:text-text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 timeline-action-btn"
                                                                            title="Düzenle"
                                                                        >
                                                                            <SlidersHorizontal className="h-3 w-3" />
                                                                        </button>
                                                                    </div>

                                                                    {/* Right Visual Grip Affordance */}
                                                                    {task.status !== 'done' && (
                                                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-30 select-none pointer-events-none w-1 items-center shrink-0">
                                                                            <div className="h-1 w-[2px] bg-current rounded-full" />
                                                                            <div className="h-1 w-[2px] bg-current rounded-full" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </React.Fragment>
                                                        )
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ── 10. Rich Hover Tooltip Card ──────────────────────────────── */}
                {hoveredTask && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${tooltipPos.x}px`,
                            top: `${tooltipPos.y}px`
                        }}
                        className="z-50 pointer-events-none p-3.5 bg-surface-100/95 backdrop-blur-sm border border-[var(--border-subtle)] rounded-xl shadow-xl w-64 flex flex-col gap-2 transition-all duration-100"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-text-primary line-clamp-2">{hoveredTask.text}</span>
                            <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-bold uppercase tracking-wider",
                                hoveredTask.status === 'done' ? "bg-emerald-100 text-emerald-800" :
                                hoveredTask.status === 'blocked' ? "bg-rose-100 text-rose-800" :
                                hoveredTask.status === 'in-progress' ? "bg-sky-100 text-sky-800" : "bg-gray-100 text-gray-800"
                            )}>
                                {hoveredTask.status === 'done' ? 'Tamamlandı' :
                                 hoveredTask.status === 'blocked' ? 'Engellendi' :
                                 hoveredTask.status === 'in-progress' ? 'Devam Ediyor' : 'Yapılacak'}
                            </span>
                        </div>

                        {hoveredTask.note && (
                            <p className="text-[10px] text-text-muted italic border-t border-[var(--border-subtle)] pt-1.5 mt-0.5 line-clamp-3">
                                "{hoveredTask.note}"
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1.5 border-t border-[var(--border-subtle)] text-[10px] font-mono">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-text-muted">Başlangıç</span>
                                <span className="text-text-primary font-semibold">{hoveredTask.startDateISO || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-text-muted">Bitiş</span>
                                <span className="text-text-primary font-semibold">{hoveredTask.dueDateISO || '-'}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[var(--border-subtle)]">
                            <span className="text-text-muted">Öncelik Durumu:</span>
                            <span className={cn(
                                "font-bold",
                                hoveredTask.isPriority ? "text-amber-600" : "text-text-muted"
                            )}>
                                {hoveredTask.isPriority ? 'Yüksek' : 'Normal'}
                            </span>
                        </div>

                        {hoveredTask.dependencies && hoveredTask.dependencies.length > 0 && (
                            <div className="text-[9px] pt-1 mt-0.5 flex flex-col gap-0.5 text-text-muted">
                                <span className="font-semibold text-text-primary">Öncül Görevler (Bağımlı):</span>
                                <span className="truncate">{hoveredTask.dependencies.length} iş kalemine bağlı.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Injected hover CSS for action buttons inside bars */}
            <style dangerouslySetInnerHTML={{__html: `
                [id^="timeline-bar-"]:hover .timeline-action-btn {
                    opacity: 1 !important;
                }
            `}} />
        </div>
    )
}
