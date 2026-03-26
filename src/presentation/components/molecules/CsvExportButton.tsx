'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

/**
 * CsvExportButton molecule — Spec §9.4
 *
 * A button in the Label Dashboard that triggers a CSV download of the
 * A&R analytics data.  Uses a browser anchor tag to initiate the download
 * from the /api/export endpoint (server-side CSV generation).
 */
export function CsvExportButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const response = await fetch('/api/export')
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const dateStr = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `darktunes-ar-export-${dateStr}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? 'Export wird erstellt …' : '📥 Daten exportieren (CSV)'}
    </Button>
  )
}
