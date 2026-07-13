/**
 * Supabase Join Parser Utilities
 *
 * Helper functions to safely extract joined relational data from Supabase queries
 * and enforce type safety without manual Array.isArray checks everywhere.
 */

/**
 * Safely parses a one-to-many relationship result into an array.
 * Supabase might return undefined, null, or a single object if improperly queried.
 * This ensures it always returns an array of the generic type.
 */
export function parseOneToMany<T>(data: unknown): T[] {
  if (!data) return []
  return Array.isArray(data) ? data : [data as T]
}

/**
 * Safely parses a one-to-one relationship result into a single object or null.
 * Sometimes Supabase returns an array for a one-to-one relation if not explicitly
 * cast or if the schema isn't strictly recognized as unique by PostgREST.
 */
export function parseOneToOne<T>(data: unknown): T | null {
  if (!data) return null
  return Array.isArray(data) ? (data.length > 0 ? data[0] : null) : (data as T)
}
