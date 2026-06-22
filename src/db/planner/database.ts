export const plannerDb = {} as Record<string, unknown>
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
export function nowISO(): string {
    return new Date().toISOString()
}
export function todayKey(): string {
    return new Date().toISOString().split('T')[0]
}
export async function clearPlannerData(): Promise<void> {}
