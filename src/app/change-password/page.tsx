'use client'

import { useFormState } from 'react-dom'
import { useState, useEffect } from 'react'
import { changePassword, type ChangePasswordState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

const initialState: ChangePasswordState = {
  error: undefined,
}

export default function ChangePasswordPage() {
  const [state, formAction] = useFormState(changePassword, initialState)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isSubmitting) return
    if (state && state.error) {
      setIsSubmitting(false)
    }
  }, [state, isSubmitting])

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
        <form
          action={formAction}
          onSubmit={() => setIsSubmitting(true)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <div className="relative">
              <Input
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                label="Nova senha"
                minLength={6}
                required
              />
              <button
                type="button"
                aria-label={
                  showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'
                }
                aria-pressed={showNewPassword}
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <Input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirmar nova senha"
                minLength={6}
                required
              />
              <button
                type="button"
                aria-label={
                  showConfirmPassword
                    ? 'Ocultar confirmação de senha'
                    : 'Mostrar confirmação de senha'
                }
                aria-pressed={showConfirmPassword}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {state?.error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {state.error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
