import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { del, put } from '@vercel/blob'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'Arquivo muito grande (máximo 5MB por arquivo)' },
      { status: 413 }
    )
  }

  const safeName =
    file.name.replace(/[^a-zA-Z0-9.\-]/g, '_') ||
    `anexo-${Date.now().toString(16)}`
  const pathname = `tickets/uploads/${Date.now()}-${safeName}`

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type || 'application/octet-stream',
  })

  return NextResponse.json({
    url: blob.url,
    size: file.size,
    type: file.type,
  })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let url: string | undefined
  try {
    const body = await request.json()
    url = body?.url
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  await del(url)

  return NextResponse.json({ ok: true })
}
