'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { Role, TicketPriority, TicketStatus } from '@prisma/client'
import { getBus } from '@/lib/realtime/bus'
import { sendEmail, buildTicketLink } from '@/lib/notifications/email'
import sanitizeHtml from 'sanitize-html'

const TicketCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  assignedToId: z.string().optional().nullable(),
  deadlineForecast: z.coerce.date().optional().nullable(),
})

function requireRole(role: string | undefined | null, allowed: Role[]) {
  if (!role) throw new Error('Unauthorized: missing role')
  if (!allowed.includes(role as Role)) {
    throw new Error('Forbidden: insufficient permissions')
  }
}

export async function createTicket(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id
  if (!userId) throw new Error('Unauthorized: missing user id')

  const rawAssignedTo = formData.get('assignedToId')
  const rawDeadline = formData.get('deadlineForecast')

  const parsed = TicketCreateSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    assignedToId:
      !rawAssignedTo || rawAssignedTo === 'none' ? null : rawAssignedTo,
    deadlineForecast: rawDeadline ? rawDeadline : undefined,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
  }

  const data = parsed.data
  const safeDescription = sanitizeHtml(data.description, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      '*': ['style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  })
  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: safeDescription,
      priority: data.priority as TicketPriority,
      assignedToId: data.assignedToId || null,
      deadlineForecast: data.deadlineForecast || null,
      customerId: userId,
    },
    select: { id: true, status: true },
  })

  const attachmentUrlsRaw = formData.getAll('attachmentUrls')
  const attachmentUrls = attachmentUrlsRaw
    .map((value) => (typeof value === 'string' ? value : String(value)))
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  if (attachmentUrls.length > 0) {
    await prisma.message.createMany({
      data: attachmentUrls.map((url) => ({
        content: url,
        type: 'IMAGE',
        fileUrl: url,
        ticketId: ticket.id,
        userId,
      })),
    })
  }

  if (data.assignedToId) {
    try {
      const target = await prisma.user.findUnique({
        where: { id: data.assignedToId || undefined },
        select: { email: true, name: true },
      })
      const ticketInfo = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        select: { title: true, id: true },
      })
      if (target?.email && ticketInfo?.title) {
        const link = buildTicketLink(ticket.id)
        const shortId = ticket.id.slice(0, 6)
        const subject = `[Fixit] Novo chamado atribuído — ${ticketInfo.title}`
        const text = [
          `Olá${target.name ? ` ${target.name}` : ''},`,
          '',
          'Um chamado foi atribuído a você:',
          `Título: "${ticketInfo.title}"`,
          `ID: ${shortId}`,
          `Acesse para iniciar: ${link}`,
          '',
          'Obrigado,',
          'Fixit',
        ].join('\n')
        const html = [
          `<p>Olá${target.name ? ` ${target.name}` : ''},</p>`,
          `<p>Um chamado foi atribuído a você:</p>`,
          `<ul>`,
          `<li><strong>Título:</strong> ${ticketInfo.title}</li>`,
          `<li><strong>ID:</strong> <code>${shortId}</code></li>`,
          `</ul>`,
          `<p><a href="${link}">Clique aqui para abrir o chamado</a></p>`,
          `<p>Obrigado,<br/>Fixit</p>`,
        ].join('')
        await sendEmail({
          to: target.email,
          subject,
          text,
          html,
        })
      }
    } catch {}
  }

  // Registra criação no histórico
  try {
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actionType: 'STATUS_CHANGE',
        oldValue: null,
        newValue: 'OPEN',
        userId,
      },
    })
  } catch {}

  revalidatePath('/tickets')
  try {
    getBus().emit('tickets:event', {
      type: 'ticket:created',
      ticketId: ticket.id,
    })
  } catch {}
  redirect('/tickets?assignedTo=any&created=1')
}

const TicketCommentSchema = z.object({
  message: z.string().min(1),
})

export async function addComment(ticketId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id
  if (!userId) throw new Error('Unauthorized: missing user id')

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { customerId: true, assignedToId: true },
  })
  if (!ticket) throw new Error('Ticket not found')
  const isAdmin = session.user.role === 'ADMIN'
  const isTech = session.user.role === 'TECH'
  const isUser = session.user.role === 'USER'
  const isOwner = ticket.customerId === userId
  const isAssignedTech = ticket.assignedToId === userId

  if (isUser && !isOwner) {
    throw new Error('Forbidden: cannot comment on this ticket')
  }

  if (!isAdmin && !isOwner && !(isTech && isAssignedTech)) {
    throw new Error('Forbidden: cannot comment on this ticket')
  }

  const parsed = TicketCommentSchema.safeParse({
    message: formData.get('message'),
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
  }

  await prisma.message.create({
    data: {
      content: parsed.data.message,
      type: 'TEXT',
      ticketId,
      userId,
    },
  })

  try {
    getBus().emit('tickets:event', { type: 'ticket:commented', ticketId })
  } catch {}
  revalidatePath(`/tickets/${ticketId}`)
}

export async function addAttachments(ticketId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const userId = session.user.id
  if (!userId) throw new Error('Unauthorized: missing user id')

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { customerId: true, assignedToId: true },
  })
  if (!ticket) throw new Error('Ticket not found')
  const isAdmin = session.user.role === 'ADMIN'
  const isTech = session.user.role === 'TECH'
  const isUser = session.user.role === 'USER'
  const isOwner = ticket.customerId === userId
  const isAssignedTech = ticket.assignedToId === userId

  if (isUser && !isOwner) {
    throw new Error('Forbidden: cannot add attachments to this ticket')
  }

  if (!isAdmin && !isOwner && !(isTech && isAssignedTech)) {
    throw new Error('Forbidden: cannot add attachments to this ticket')
  }

  const attachmentUrlsRaw = formData.getAll('attachmentUrls')
  const attachmentUrls = attachmentUrlsRaw
    .map((value) => (typeof value === 'string' ? value : String(value)))
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  if (attachmentUrls.length === 0) {
    return
  }

  await prisma.message.createMany({
    data: attachmentUrls.map((url) => ({
      content: url,
      type: 'IMAGE',
      fileUrl: url,
      ticketId,
      userId,
    })),
  })

  try {
    getBus().emit('tickets:event', {
      type: 'ticket:attachments',
      ticketId,
      count: attachmentUrls.length,
    })
  } catch {}
  revalidatePath(`/tickets/${ticketId}`)
}

const TicketStatusSchema = z.object({
  status: z.enum([
    'OPEN',
    'IN_PROGRESS',
    'WAITING',
    'DONE',
    'CLOSED',
    'CANCELLED',
  ]),
})

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'WAITING', 'CANCELLED'],
  IN_PROGRESS: ['OPEN', 'WAITING', 'DONE', 'CANCELLED'],
  WAITING: ['IN_PROGRESS', 'CANCELLED'],
  DONE: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
}

export async function updateStatus(ticketId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  requireRole(session.user.role, ['ADMIN', 'TECH'])

  const parsed = TicketStatusSchema.safeParse({
    status: formData.get('status'),
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
  }

  const nextStatus = parsed.data.status as TicketStatus
  const now = new Date()
  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      status: true,
      createdAt: true,
      deliveryDate: true,
      assignedToId: true,
    },
  })
  if (!existing) throw new Error('Ticket not found')

  const isAdmin = session.user.role === 'ADMIN'
  const isAssignedTech = existing.assignedToId === session.user.id
  if (!isAdmin && !isAssignedTech) {
    throw new Error('Forbidden: cannot change status for this ticket')
  }

  const currentStatus = existing.status as TicketStatus
  const allowedNext = allowedTransitions[currentStatus] || []
  if (!allowedNext.includes(nextStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${nextStatus}`
    )
  }

  const updateData: Record<string, unknown> = { status: nextStatus }
  if (nextStatus === 'DONE') {
    updateData.deliveryDate = now
  }
  if (nextStatus === 'CLOSED') {
    updateData.closedAt = now
    const start = existing.deliveryDate ?? existing.createdAt
    const minutes = Math.max(
      0,
      Math.round((now.getTime() - start.getTime()) / 60000)
    )
    updateData.executionTime = minutes
  }

  await prisma.ticket.update({ where: { id: ticketId }, data: updateData })

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actionType: 'STATUS_CHANGE',
      oldValue: existing.status,
      newValue: nextStatus,
      userId: session.user.id!,
    },
  })

  try {
    getBus().emit('tickets:event', {
      type: 'ticket:status',
      ticketId,
      status: nextStatus,
    })
    if (nextStatus === 'CLOSED' || nextStatus === 'CANCELLED') {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          customer: { select: { email: true, name: true } },
          title: true,
          id: true,
        },
      })
      if (ticket?.customer?.email) {
        const link = buildTicketLink(ticket.id)
        const shortId = ticket.id.slice(0, 6)
        const subject = `[Fixit] Chamado ${nextStatus === 'CLOSED' ? 'Fechado' : 'Cancelado'} — ${ticket.title}`
        const text = [
          `Olá${ticket.customer?.name ? ` ${ticket.customer.name}` : ''},`,
          '',
          `O chamado "${ticket.title}" (ID: ${shortId}) foi ${nextStatus === 'CLOSED' ? 'fechado' : 'cancelado'}.`,
          `Acesse os detalhes: ${link}`,
          '',
          'Atenciosamente,',
          'Fixit',
        ].join('\n')
        const html = [
          `<p>Olá${ticket.customer?.name ? ` ${ticket.customer.name}` : ''},</p>`,
          `<p>O chamado <strong>"${ticket.title}"</strong> (ID: <code>${shortId}</code>) foi ${nextStatus === 'CLOSED' ? 'fechado' : 'cancelado'}.</p>`,
          `<p><a href="${link}">Clique aqui para ver os detalhes do chamado</a></p>`,
          `<p>Atenciosamente,<br/>Fixit</p>`,
        ].join('')
        await sendEmail({
          to: ticket.customer.email,
          subject,
          text,
          html,
        })
      }
    }
  } catch {}
  revalidatePath(`/tickets/${ticketId}`)
  revalidatePath('/tickets')
}

export async function deleteTicket(ticketId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  requireRole(session.user.role, ['ADMIN'])

  await prisma.ticket.delete({ where: { id: ticketId } })
  try {
    getBus().emit('tickets:event', { type: 'ticket:deleted', ticketId })
  } catch {}
  revalidatePath('/tickets')
}

const TicketUpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().nullable().optional(),
  deadlineForecast: z.coerce.date().nullable().optional(),
})

export async function updateTicket(ticketId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const userId = session.user.id
  if (!userId) throw new Error('Unauthorized: missing user id')

  const parsed = TicketUpdateSchema.safeParse({
    title: formData.get('title') || undefined,
    description: formData.get('description') || undefined,
    priority: formData.get('priority') || undefined,
    assignedToId: formData.get('assignedToId') || undefined,
    deadlineForecast: (() => {
      const raw = formData.get('deadlineForecast')
      if (!raw) return undefined
      return raw
    })(),
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
  }

  const data = parsed.data
  const prev = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { priority: true, assignedToId: true, customerId: true },
  })
  if (!prev) throw new Error('Ticket not found')

  const isAdmin = session.user.role === 'ADMIN'
  const isTech = session.user.role === 'TECH'
  const isOwner = prev.customerId === userId
  const isAssignedTech = prev.assignedToId === userId

  if (!isAdmin && !isOwner && !(isTech && isAssignedTech)) {
    throw new Error('Forbidden: cannot edit this ticket')
  }

  const canEditBasicFields = isAdmin || isOwner || (isTech && isAssignedTech)
  const canEditAdvancedFields = isAdmin || (isTech && isAssignedTech)

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(canEditBasicFields && data.title ? { title: data.title } : {}),
      ...(canEditBasicFields && data.description
        ? {
            description: sanitizeHtml(data.description, {
              allowedTags: sanitizeHtml.defaults.allowedTags,
              allowedAttributes: {
                a: ['href', 'name', 'target', 'rel'],
                img: ['src', 'alt', 'title'],
                '*': ['style'],
              },
              allowedSchemes: ['http', 'https', 'mailto'],
            }),
          }
        : {}),
      ...(canEditAdvancedFields && data.priority
        ? { priority: data.priority as TicketPriority }
        : {}),
      ...(canEditAdvancedFields && data.hasOwnProperty('assignedToId')
        ? { assignedToId: data.assignedToId || null }
        : {}),
      ...(canEditAdvancedFields && data.hasOwnProperty('deadlineForecast')
        ? { deadlineForecast: data.deadlineForecast || null }
        : {}),
    },
  })

  if (
    canEditAdvancedFields &&
    data.priority &&
    data.priority !== prev.priority
  ) {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        actionType: 'PRIORITY_CHANGE',
        oldValue: prev.priority,
        newValue: data.priority,
        userId: session.user.id!,
      },
    })
  }

  if (
    canEditAdvancedFields &&
    data.hasOwnProperty('assignedToId') &&
    data.assignedToId !== prev.assignedToId
  ) {
    await prisma.ticketHistory.create({
      data: {
        ticketId,
        actionType: 'ASSIGNMENT',
        oldValue: prev.assignedToId ?? null,
        newValue: data.assignedToId ?? null,
        userId: session.user.id!,
      },
    })
    try {
      getBus().emit('tickets:event', {
        type: 'ticket:assigned',
        ticketId,
        to: data.assignedToId,
      })
      const target = await prisma.user.findUnique({
        where: { id: data.assignedToId || undefined },
        select: { email: true, name: true },
      })
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { title: true, id: true },
      })
      if (target?.email && ticket?.title) {
        const link = buildTicketLink(ticketId)
        const shortId = ticket.id.slice(0, 6)
        const subject = `[Fixit] Novo chamado atribuído — ${ticket.title}`
        const text = [
          `Olá${target.name ? ` ${target.name}` : ''},`,
          '',
          'Um chamado foi atribuído a você:',
          `Título: "${ticket.title}"`,
          `ID: ${shortId}`,
          `Acesse para iniciar: ${link}`,
          '',
          'Obrigado,',
          'Fixit',
        ].join('\n')
        const html = [
          `<p>Olá${target.name ? ` ${target.name}` : ''},</p>`,
          `<p>Um chamado foi atribuído a você:</p>`,
          `<ul>`,
          `<li><strong>Título:</strong> ${ticket.title}</li>`,
          `<li><strong>ID:</strong> <code>${shortId}</code></li>`,
          `</ul>`,
          `<p><a href="${link}">Clique aqui para abrir o chamado</a></p>`,
          `<p>Obrigado,<br/>Fixit</p>`,
        ].join('')
        await sendEmail({
          to: target.email,
          subject,
          text,
          html,
        })
      }
    } catch {}
  }

  revalidatePath('/tickets')
  revalidatePath(`/tickets/${ticketId}`)
}

export async function assignTicketToMe(ticketId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  requireRole(session.user.role, ['ADMIN', 'TECH'])

  const userId = session.user.id

  const prev = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { assignedToId: true },
  })

  if (!prev) throw new Error('Ticket not found')
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
      actionType: 'ASSIGNMENT',
      oldValue: prev.assignedToId ?? null,
      newValue: userId,
      userId,
    },
  })

  try {
    getBus().emit('tickets:event', {
      type: 'ticket:assigned',
      ticketId,
      to: userId,
    })
  } catch {}
  revalidatePath('/tickets')
  revalidatePath(`/tickets/${ticketId}`)
}
