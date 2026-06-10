import { query } from '../database/pool.js'

export async function logActivity(
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: Record<string, unknown>
): Promise<void> {
  await query(
    `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, entityType ?? null, entityId ?? null, details ? JSON.stringify(details) : null]
  )
}
