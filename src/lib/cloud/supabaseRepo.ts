import { supabase } from '@/config/supabase'
import { requireCurrentUserId } from './currentUser'

interface Filter {
  column: string
  value: any
}

interface ListOptions {
  filters?: Filter[]
  orderBy?: string
  ascending?: boolean
}

export async function listOwnedRows(
  tableName: string,
  options: ListOptions = {}
): Promise<any[]> {
  const userId = requireCurrentUserId()
  let query = supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)

  if (options.filters) {
    for (const filter of options.filters) {
      query = query.eq(filter.column, filter.value)
    }
  }

  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true })
  }

  const { data, error } = await query
  if (error) {
    console.error(`Error listing owned rows from ${tableName}:`, error)
    throw error
  }
  return data || []
}

export async function upsertOwnedRow(
  tableName: string,
  row: Record<string, any>,
  options: { onConflict?: string } = {}
): Promise<any> {
  const userId = requireCurrentUserId()
  const payload = {
    ...row,
    user_id: userId,
  }

  const { data, error } = await supabase
    .from(tableName)
    .upsert(payload, options)
    .select()

  if (error) {
    console.error(`Error upserting owned row to ${tableName}:`, error)
    throw error
  }
  return data?.[0] || null
}

export async function upsertOwnedRows(
  tableName: string,
  rows: Array<Record<string, any>>,
  options: { onConflict?: string } = {}
): Promise<any[]> {
  if (rows.length === 0) {
    return []
  }

  const userId = requireCurrentUserId()
  const payload = rows.map((row) => ({
    ...row,
    user_id: userId,
  }))

  const { data, error } = await supabase
    .from(tableName)
    .upsert(payload, options)
    .select()

  if (error) {
    console.error(`Error upserting owned rows to ${tableName}:`, error)
    throw error
  }
  return data || []
}

export async function updateOwnedRows(
  tableName: string,
  patch: Record<string, any>,
  filters: Filter[] = []
): Promise<any[]> {
  const userId = requireCurrentUserId()
  let query = supabase
    .from(tableName)
    .update(patch)
    .eq('user_id', userId)

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value)
  }

  const { data, error } = await query.select()
  if (error) {
    console.error(`Error updating owned rows in ${tableName}:`, error)
    throw error
  }
  return data || []
}

export async function deleteOwnedRows(
  tableName: string,
  filters: Filter[] = []
): Promise<any[]> {
  const userId = requireCurrentUserId()
  let query = supabase
    .from(tableName)
    .delete()
    .eq('user_id', userId)

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value)
  }

  const { data, error } = await query.select()
  if (error) {
    console.error(`Error deleting owned rows from ${tableName}:`, error)
    throw error
  }
  return data || []
}
