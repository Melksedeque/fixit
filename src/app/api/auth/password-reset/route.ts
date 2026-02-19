import { NextResponse } from 'next/server'
import { requestPasswordReset } from '@/app/login/actions'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'E-mail é obrigatório.' },
        { status: 400 }
      )
    }
    const result = await requestPasswordReset(email)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[api] password-reset failed', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Não foi possível solicitar recuperação de senha.',
      },
      { status: 500 }
    )
  }
}
