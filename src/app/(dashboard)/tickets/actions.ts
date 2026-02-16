"use server"

import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { TicketPriority, TicketStatus } from "@prisma/client"
import { put } from "@vercel/blob"

const TicketCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  assignedToId: z.string().optional().nullable(),
  deadlineForecast: z.coerce.date().optional().nullable(),
})

export async function createTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const userId = session.user.id
  if (!userId) throw new Error("Unauthorized: missing user id")

  const rawAssignedTo = formData.get("assignedToId")
   const rawDeadline = formData.get("deadlineForecast")

  const parsed = TicketCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    assignedToId: !rawAssignedTo || rawAssignedTo === "none" ? null : rawAssignedTo,
    deadlineForecast: rawDeadline ? rawDeadline : undefined,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join(", "))
  }

  const data = parsed.data
  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority as TicketPriority,
      assignedToId: data.assignedToId || null,
      deadlineForecast: data.deadlineForecast || null,
      customerId: userId,
    },
    select: { id: true },
  })

  const files = formData
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0)

  if (files.length > 0) {
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_")
          const pathname = `tickets/${ticket.id}/${Date.now()}-${safeName}`
          const blob = await put(pathname, file, {
            access: "public",
            addRandomSuffix: true,
          })
          return blob
        }),
      )

      if (uploads.length > 0) {
        await prisma.message.createMany({
          data: uploads.map((blob) => ({
            content: blob.url,
            type: "IMAGE",
            fileUrl: blob.url,
            ticketId: ticket.id,
            userId,
          })),
        })
      }
    } catch (error) {
      console.error("Failed to upload attachments", error)
    }
  }

  revalidatePath("/tickets")
}

const TicketCommentSchema = z.object({
  message: z.string().min(1),
})

export async function addComment(ticketId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const userId = session.user.id
  if (!userId) throw new Error("Unauthorized: missing user id")

  const parsed = TicketCommentSchema.safeParse({
    message: formData.get("message"),
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join(", "))
  }

  await prisma.message.create({
    data: {
      content: parsed.data.message,
      type: "TEXT",
      ticketId,
      userId,
    },
  })

  revalidatePath(`/tickets/${ticketId}`)
}

const TicketStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "DONE", "CLOSED", "CANCELLED"]),
})

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "WAITING", "CANCELLED"],
  IN_PROGRESS: ["OPEN", "WAITING", "DONE", "CANCELLED"],
  WAITING: ["IN_PROGRESS", "CANCELLED"],
  DONE: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
}

export async function updateStatus(ticketId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const parsed = TicketStatusSchema.safeParse({
    status: formData.get("status"),
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join(", "))
  }

  const nextStatus = parsed.data.status as TicketStatus
  const now = new Date()
  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { status: true, createdAt: true, deliveryDate: true },
  })
  if (!existing) throw new Error("Ticket not found")

  const currentStatus = existing.status as TicketStatus
  const allowedNext = allowedTransitions[currentStatus] || []
  if (!allowedNext.includes(nextStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}`)
  }

  const updateData: Record<string, unknown> = { status: nextStatus }
  if (nextStatus === "DONE") {
    updateData.deliveryDate = now
  }
  if (nextStatus === "CLOSED") {
    updateData.closedAt = now
    const start = existing.deliveryDate ?? existing.createdAt
    const minutes = Math.max(0, Math.round((now.getTime() - start.getTime()) / 60000))
    updateData.executionTime = minutes
  }

  await prisma.ticket.update({ where: { id: ticketId }, data: updateData })

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actionType: "STATUS_CHANGE",
      oldValue: existing.status,
      newValue: nextStatus,
      userId: session.user.id!,
    }
  })

  revalidatePath(`/tickets/${ticketId}`)
  revalidatePath("/tickets")
}

export async function deleteTicket(ticketId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.ticket.delete({ where: { id: ticketId } })
  revalidatePath("/tickets")
}

const TicketUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(1).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assignedToId: z.string().nullable().optional(),
  deadlineForecast: z.coerce.date().nullable().optional(),
})

export async function updateTicket(ticketId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const parsed = TicketUpdateSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    deadlineForecast: (() => {
      const raw = formData.get("deadlineForecast")
      if (!raw) return undefined
      return raw
    })(),
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join(", "))
  }

const data = parsed.data
const prev = await prisma.ticket.findUnique({
  where: { id: ticketId },
  select: { priority: true, assignedToId: true }
})
if (!prev) throw new Error("Ticket not found")

await prisma.ticket.update({
  where: { id: ticketId },
  data: {
    ...(data.title ? { title: data.title } : {}),
    ...(data.description ? { description: data.description } : {}),
    ...(data.priority ? { priority: data.priority as TicketPriority } : {}),
    ...(data.hasOwnProperty("assignedToId") ? { assignedToId: data.assignedToId || null } : {}),
    ...(data.hasOwnProperty("deadlineForecast") ? { deadlineForecast: data.deadlineForecast || null } : {}),
  },
})

if (data.priority && data.priority !== prev.priority) {
  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actionType: "PRIORITY_CHANGE",
      oldValue: prev.priority,
      newValue: data.priority,
      userId: session.user.id!,
    }
  })
}

if (data.hasOwnProperty("assignedToId") && data.assignedToId !== prev.assignedToId) {
  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actionType: "ASSIGNMENT",
      oldValue: prev.assignedToId ?? null,
      newValue: data.assignedToId ?? null,
      userId: session.user.id!,
    }
  })
}

  revalidatePath("/tickets")
  revalidatePath(`/tickets/${ticketId}`)
}

export async function assignTicketToMe(ticketId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const userId = session.user.id

  const prev = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { assignedToId: true },
  })

  if (!prev) throw new Error("Ticket not found")
  if (prev.assignedToId === userId) {
    return
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { assignedToId: userId },
  })

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actionType: "ASSIGNMENT",
      oldValue: prev.assignedToId ?? null,
      newValue: userId,
      userId,
    },
  })

  revalidatePath("/tickets")
  revalidatePath(`/tickets/${ticketId}`)
}
