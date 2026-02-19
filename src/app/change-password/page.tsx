'use client'

import { useFormState } from 'react-dom'
import { changePassword, type ChangePasswordState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const initialState: ChangePasswordState = {
  error: undefined,
}

export default function ChangePasswordPage() {
  const [state, formAction] = useFormState(changePassword, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg shadow-lg p-6">
        <h1 className="text-xl font-semibold mb-4 text-foreground">
          Definir nova senha
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Por segurança, defina uma nova senha antes de continuar usando o
          sistema.
        </p>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Input
              name="newPassword"
              type="password"
              label="Nova senha"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              name="confirmPassword"
              type="password"
              label="Confirmar nova senha"
              minLength={6}
              required
            />
          </div>
          {state?.error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {state.error}
            </div>
          )}
          <Button type="submit" className="w-full">
            Salvar nova senha
          </Button>
        </form>
      </div>
    </div>
  )
}
