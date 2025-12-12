/**
 * Route API de health check
 * GET /api/health
 */

import { NextResponse } from 'next/server'
import { ApiResponse } from '@/types/api'

export async function GET() {
  return NextResponse.json<ApiResponse<{ status: string; timestamp: string }>>({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  })
}

