import { NextResponse } from "next/server"
import { getBus } from "@/lib/realtime/bus"
import { auth } from "@/lib/auth/config"

const clientsPerUser: Map<string, number> = new Map()
const MAX_CLIENTS_PER_USER = 3

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const current = clientsPerUser.get(userId) || 0
  if (current >= MAX_CLIENTS_PER_USER) {
    return NextResponse.json({ error: "Too many connections" }, { status: 429 })
  }
  clientsPerUser.set(userId, current + 1)

  const bus = getBus()

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const write = (data: unknown) => {
        const payload = typeof data === "string" ? data : JSON.stringify(data)
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
      }

      write({ type: "connected", ts: Date.now() })

      const handler = (event: unknown) => write(event)
      bus.on("tickets:event", handler)

      const pingInterval = setInterval(() => {
        write({ type: "ping", ts: Date.now() })
      }, 25000)

      const cleanup = () => {
        clearInterval(pingInterval)
        bus.off("tickets:event", handler)
        const curr = clientsPerUser.get(userId) || 1
        clientsPerUser.set(userId, Math.max(0, curr - 1))
      }

      // Close when the client disconnects
      // @ts-expect-error Controllers have an internal cancel
      controller.signal?.addEventListener?.("abort", cleanup)
    },
    cancel() {
      // handled in cleanup above
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
