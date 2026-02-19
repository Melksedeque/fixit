import { Resend } from 'resend'

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
    console.warn(
      '[email] missing RESEND_API_KEY or RESEND_FROM, skipping send',
      {
        hasApiKey: Boolean(apiKey),
        hasFrom: Boolean(from),
        to: payload.to,
      }
    )
    return
  }

  console.log('[email] sendEmail called', {
    to: payload.to,
    subject: payload.subject,
    hasHtml: Boolean(payload.html),
  })

  const resend = new Resend(apiKey)
  const usesUnverifiedDomain = from.includes('vercel.app')
  const safeFrom = usesUnverifiedDomain
    ? 'Fixit - Sistema de Chamados <onboarding@resend.dev>'
    : from

  try {
    await resend.emails.send({
      from: safeFrom,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      ...(payload.html ? { html: payload.html } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    })
    console.log('[email] sendEmail succeeded', {
      to: payload.to,
      subject: payload.subject,
    })
    if (usesUnverifiedDomain) {
      console.warn(
        '[email] using onboarding@resend.dev as From (domain unverified)',
        {
          requestedFrom: from,
          effectiveFrom: safeFrom,
          replyTo,
        }
      )
    }
  } catch (error) {
    console.error('[email] send failed', {
      error: String(error),
      to: payload.to,
      subject: payload.subject,
    })
  }
}

export function buildTicketLink(ticketId: string) {
  const baseUrl =
    process.env.FIXIT_BASE_URL || 'https://fixit-chamados.vercel.app'
  return `${baseUrl}/tickets/${ticketId}`
}

type BasicUser = {
  name: string | null
  email: string
}

type BasicTicket = {
  id: string
  title: string
}

export async function sendWelcomeEmail(user: BasicUser) {
  const shortName = user.name?.split(' ')[0] || ''
  const greeting = shortName ? `Olá ${shortName},` : 'Olá,'

  const subject = '[Fixit] Bem-vindo(a) à plataforma de chamados'
  const text = [
    greeting,
    '',
    'Sua conta na Fixit - Sistema de Chamados foi criada com sucesso.',
    'A partir de agora você pode abrir chamados, acompanhar o andamento e interagir com a equipe técnica.',
    '',
    'Obrigado,',
    'Fixit - Sistema de Chamados',
  ].join('\n')

  const html = [
    `<p>${greeting}</p>`,
    `<p>Sua conta na <strong>Fixit</strong> foi criada com sucesso.</p>`,
    `<p>A partir de agora você pode abrir chamados, acompanhar o andamento e interagir com a equipe técnica.</p>`,
    `<p>Obrigado,<br/>Fixit - Sistema de Chamados</p>`,
  ].join('')

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  })
}

export async function sendTicketAssignedEmail(
  ticket: BasicTicket,
  tech: BasicUser
) {
  const link = buildTicketLink(ticket.id)
  const shortId = ticket.id.slice(0, 6)
  const greeting = tech.name ? `Olá ${tech.name},` : 'Olá,'

  const subject = `[Fixit] Novo chamado atribuído — ${ticket.title}`
  const text = [
    greeting,
    '',
    'Um chamado foi atribuído a você:',
    `Título: "${ticket.title}"`,
    `ID: ${shortId}`,
    `Acesse para iniciar: ${link}`,
    '',
    'Obrigado,',
    'Fixit - Sistema de Chamados',
  ].join('\n')

  const html = [
    `<p>${greeting}</p>`,
    `<p>Um chamado foi atribuído a você:</p>`,
    `<ul>`,
    `<li><strong>Título:</strong> ${ticket.title}</li>`,
    `<li><strong>ID:</strong> <code>${shortId}</code></li>`,
    `</ul>`,
    `<p><a href="${link}">Clique aqui para abrir o chamado</a></p>`,
    `<p>Obrigado,<br/>Fixit - Sistema de Chamados</p>`,
  ].join('')

  await sendEmail({
    to: tech.email,
    subject,
    text,
    html,
  })
}

export async function sendTicketBroadcastToTechs(
  ticket: BasicTicket,
  techs: BasicUser[]
) {
  if (!techs.length) return

  const link = buildTicketLink(ticket.id)
  const shortId = ticket.id.slice(0, 6)

  const subject = `[Fixit] Novo chamado disponível — ${ticket.title}`
  const text = [
    'Olá,',
    '',
    'Um novo chamado está disponível para atendimento:',
    `Título: "${ticket.title}"`,
    `ID: ${shortId}`,
    `Acesse o sistema para assumir o chamado: ${link}`,
    '',
    'Obrigado,',
    'Fixit - Sistema de Chamados',
  ].join('\n')

  const html = [
    `<p>Olá,</p>`,
    `<p>Um novo chamado está disponível para atendimento:</p>`,
    `<ul>`,
    `<li><strong>Título:</strong> ${ticket.title}</li>`,
    `<li><strong>ID:</strong> <code>${shortId}</code></li>`,
    `</ul>`,
    `<p><a href="${link}">Clique aqui para acessar o chamado</a></p>`,
    `<p>Obrigado,<br/>Fixit - Sistema de Chamados</p>`,
  ].join('')

  for (const tech of techs) {
    await sendEmail({
      to: tech.email,
      subject,
      text,
      html,
    })
  }
}

export async function sendTicketClosedEmail(
  ticket: BasicTicket,
  customer: BasicUser
) {
  const link = buildTicketLink(ticket.id)
  const shortId = ticket.id.slice(0, 6)
  const greeting = customer.name ? `Olá ${customer.name},` : 'Olá,'

  const subject = `[Fixit] Chamado concluído — ${ticket.title}`
  const text = [
    greeting,
    '',
    `O chamado "${ticket.title}" (ID: ${shortId}) foi concluído.`,
    `Você pode conferir os detalhes e o histórico de atendimento em: ${link}`,
    '',
    'Atenciosamente,',
    'Fixit - Sistema de Chamados',
  ].join('\n')

  const html = [
    `<p>${greeting}</p>`,
    `<p>O chamado <strong>"${ticket.title}"</strong> (ID: <code>${shortId}</code>) foi concluído.</p>`,
    `<p><a href="${link}">Clique aqui para ver os detalhes do chamado</a></p>`,
    `<p>Atenciosamente,<br/>Fixit - Sistema de Chamados</p>`,
  ].join('')

  await sendEmail({
    to: customer.email,
    subject,
    text,
    html,
  })
}

export async function sendPasswordResetEmail(
  user: BasicUser,
  temporaryPassword: string
) {
  const shortName = user.name?.split(' ')[0] || ''
  const greeting = shortName ? `Olá ${shortName},` : 'Olá,'

  const subject = '[Fixit] Recuperação de senha'
  const text = [
    greeting,
    '',
    'Você solicitou a recuperação de senha da sua conta na Fixit.',
    `Senha temporária: ${temporaryPassword}`,
    '',
    'Use essa senha para acessar o sistema e, em seguida, defina uma nova senha de sua preferência.',
    '',
    'Se você não solicitou essa alteração, ignore este e-mail.',
    '',
    'Atenciosamente,',
    'Fixit - Sistema de Chamados',
  ].join('\n')

  const html = [
    `<p>${greeting}</p>`,
    `<p>Você solicitou a recuperação de senha da sua conta na <strong>Fixit</strong>.</p>`,
    `<p><strong>Senha temporária:</strong> <code>${temporaryPassword}</code></p>`,
    `<p>Use essa senha para acessar o sistema e, em seguida, defina uma nova senha de sua preferência.</p>`,
    `<p>Se você não solicitou essa alteração, ignore este e-mail.</p>`,
    `<p>Atenciosamente,<br/>Fixit - Sistema de Chamados</p>`,
  ].join('')

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  })
}

export async function sendSlaReminderEmail(
  ticket: BasicTicket,
  tech: BasicUser,
  deadline: Date,
  level: 'ONE_DAY' | 'TWO_HOURS'
) {
  const link = buildTicketLink(ticket.id)
  const shortId = ticket.id.slice(0, 6)
  const greeting = tech.name ? `Olá ${tech.name},` : 'Olá,'
  const deadlineStr = deadline.toLocaleString('pt-BR')

  const isOneDay = level === 'ONE_DAY'
  const subject = isOneDay
    ? `[Fixit] Lembrete de SLA — 24h para o vencimento`
    : `[Fixit] Lembrete de SLA — 2h para o vencimento`

  const intro = isOneDay
    ? 'Falta aproximadamente 1 dia para o vencimento do SLA deste chamado.'
    : 'Faltam aproximadamente 2 horas para o vencimento do SLA deste chamado.'

  const text = [
    greeting,
    '',
    intro,
    '',
    `Título: "${ticket.title}"`,
    `ID: ${shortId}`,
    `Prazo previsto: ${deadlineStr}`,
    `Acesse o chamado: ${link}`,
    '',
    'Obrigado,',
    'Fixit',
  ].join('\n')

  const html = [
    `<p>${greeting}</p>`,
    `<p>${intro}</p>`,
    `<ul>`,
    `<li><strong>Título:</strong> ${ticket.title}</li>`,
    `<li><strong>ID:</strong> <code>${shortId}</code></li>`,
    `<li><strong>Prazo previsto:</strong> ${deadlineStr}</li>`,
    `</ul>`,
    `<p><a href="${link}">Clique aqui para acessar o chamado</a></p>`,
    `<p>Obrigado,<br/>Fixit - Sistema de Chamados</p>`,
  ].join('')

  await sendEmail({
    to: tech.email,
    subject,
    text,
    html,
  })
}
