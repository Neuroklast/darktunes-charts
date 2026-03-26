import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Escapes a value for safe inclusion in a CSV cell.
 * Wraps strings containing commas, quotes, or newlines in double-quotes
 * and escapes inner double-quotes by doubling them.
 */
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Converts an array of row objects to a CSV string.
 * First row is the header derived from the column order array.
 */
function toCsv(columns: string[], rows: Record<string, string | number | null>[]): string {
  const header = columns.map(csvEscape).join(',')
  const dataRows = rows.map(row =>
    columns.map(col => csvEscape(row[col])).join(',')
  )
  return [header, ...dataRows].join('\r\n')
}

/** Columns included in the A&R export (Spec §9.4). */
const EXPORT_COLUMNS = [
  'Band',
  'Tier',
  'QV-Score',
  'DJ-Score',
  'Peer-Score',
  'Combined-Score',
  'Trend',
]

/**
 * GET /api/export
 * Generates a CSV file with A&R analytics data for the authenticated Label/AR user.
 *
 * Response:
 *   Content-Type: text/csv; charset=utf-8
 *   Content-Disposition: attachment; filename="darktunes-ar-export-{date}.csv"
 *
 * Access control:
 *   Only authenticated users with role LABEL or AR can access this endpoint.
 *   In production this would query the DB for mandated bands and their scores.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In production: verify user role is LABEL or AR, fetch mandated bands + scores from Prisma.
    // For now, generate example rows to demonstrate the CSV structure.
    const exampleRows: Record<string, string | number | null>[] = [
      {
        Band: 'Nightwish',
        Tier: 'MAJOR',
        'QV-Score': 8750,
        'DJ-Score': 0.92,
        'Peer-Score': 0.87,
        'Combined-Score': 0.91,
        Trend: '+12%',
      },
      {
        Band: 'Lacuna Coil',
        Tier: 'INDIE',
        'QV-Score': 5230,
        'DJ-Score': 0.78,
        'Peer-Score': 0.81,
        'Combined-Score': 0.79,
        Trend: '+4%',
      },
    ]

    const csv = toCsv(EXPORT_COLUMNS, exampleRows)
    const dateStr = new Date().toISOString().slice(0, 10)
    const filename = `darktunes-ar-export-${dateStr}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
