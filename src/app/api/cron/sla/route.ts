import { NextResponse } from 'next/server'
import { sendSlaReminders } from '@/app/(dashboard)/tickets/actions'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await sendSlaReminders()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[cron] sla reminders failed', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
