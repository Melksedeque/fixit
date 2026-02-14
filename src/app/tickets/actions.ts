 "use server"
 
 import { auth } from "@/lib/auth/config"
 import { prisma } from "@/lib/prisma"
 import { revalidatePath } from "next/cache"
 import { z } from "zod"
 import { TicketPriority, TicketStatus } from "@prisma/client"
 
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
 
   const parsed = TicketCreateSchema.safeParse({
     title: formData.get("title"),
     description: formData.get("description"),
     priority: formData.get("priority"),
     assignedToId: formData.get("assignedToId") || null,
     deadlineForecast: formData.get("deadlineForecast"),
   })
   if (!parsed.success) {
     throw new Error(parsed.error.issues.map(i => i.message).join(", "))
   }
 
   const data = parsed.data
   await prisma.ticket.create({
     data: {
       title: data.title,
       description: data.description,
       priority: data.priority as TicketPriority,
       assignedToId: data.assignedToId || null,
       deadlineForecast: data.deadlineForecast || null,
       customerId: userId,
     },
   })
 
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
   status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]),
 })
 
 export async function updateStatus(ticketId: string, formData: FormData) {
   const session = await auth()
   if (!session?.user) throw new Error("Unauthorized")
 
   const parsed = TicketStatusSchema.safeParse({
     status: formData.get("status"),
   })
   if (!parsed.success) {
     throw new Error(parsed.error.issues.map(i => i.message).join(", "))
   }
 
   await prisma.ticket.update({
     where: { id: ticketId },
     data: { status: parsed.data.status as TicketStatus },
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
     deadlineForecast: formData.get("deadlineForecast") || undefined,
   })
   if (!parsed.success) {
     throw new Error(parsed.error.issues.map(i => i.message).join(", "))
   }
 
   const data = parsed.data
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
 
   revalidatePath("/tickets")
   revalidatePath(`/tickets/${ticketId}`)
 }
