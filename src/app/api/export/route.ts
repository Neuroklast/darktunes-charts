import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'
import { prisma } from '@/lib/prisma'

type ExportDb = {
  band: {
    findMany: (args: unknown) => Promise<Array<{
      id: string
      name: string
      tier: string
      fanVotes: Array<{ votes: number }>
    }>>
  }
}

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
 *   Only LABEL, AR, or ADMIN roles can access this endpoint.
 */
export const GET = withAuth(['LABEL', 'AR', 'ADMIN'], async (_request: NextRequest) => {
  const db = prisma as unknown as ExportDb
  const bands = await db.band.findMany({
    include: { fanVotes: { select: { votes: true } } },
    orderBy: { name: 'asc' },
  })

  const rows: Record<string, string | number | null>[] = bands.map((b) => ({
    Band: b.name,
    Tier: b.tier,
    'QV-Score': b.fanVotes.reduce((sum, v) => sum + v.votes, 0),
    'DJ-Score': 0,
    'Peer-Score': 0,
    'Combined-Score': 0,
    Trend: '',
  }))

  const csv = toCsv(EXPORT_COLUMNS, rows)
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
})
