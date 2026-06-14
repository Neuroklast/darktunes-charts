import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security'

// Basic POST stub for now
export const POST = withAuth(['ADMIN', 'DJ', 'BAND'], async (_request: NextRequest, _user) => {
  return NextResponse.json({ success: true })
})
