import { Resend } from "resend"

type EmailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  const replyTo = process.env.RESEND_REPLY_TO || from

  if (!apiKey || !from) {
    console.warn("[email] missing RESEND_API_KEY or RESEND_FROM, skipping send", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
      to: payload.to,
    })
    return
  }

  const resend = new Resend(apiKey)
  const usesUnverifiedDomain = from.includes("vercel.app")
  const safeFrom = usesUnverifiedDomain ? "Fixit <onboarding@resend.dev>" : from

  try {
    await resend.emails.send({
      from: safeFrom,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      ...(payload.html ? { html: payload.html } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    })
    if (usesUnverifiedDomain) {
      console.warn("[email] using onboarding@resend.dev as From (domain unverified)", {
        requestedFrom: from,
        effectiveFrom: safeFrom,
        replyTo,
      })
    }
  } catch (error) {
    console.error("[email] send failed", {
      error: String(error),
      to: payload.to,
      subject: payload.subject,
    })
  }
}

export function buildTicketLink(ticketId: string) {
  const baseUrl = process.env.FIXIT_BASE_URL || "https://fixit-chamados.vercel.app"
  return `${baseUrl}/tickets/${ticketId}`
}
