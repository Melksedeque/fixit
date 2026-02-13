"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogIn, ArrowRight } from "lucide-react"
import { checkEmail } from "@/app/login/actions"

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "password">("email")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange"
  })

  const handleNextStep = async () => {
    const isValid = await trigger("email")
    if (!isValid) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const email = getValues("email")
      const result = await checkEmail(email)

      if (result.exists) {
        setStep("password")
        setLoading(false)
        // Need to wait for render to focus password
        setTimeout(() => setFocus("password"), 100)
      } else {
        setError("E-mail não encontrado.")
        setLoading(false)
      }
    } catch {
      setError("Erro ao verificar e-mail.")
      setLoading(false)
    }
  }

  async function onSubmit(data: LoginFormValues) {
    setLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Senha incorreta.")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("Ocorreu um erro ao tentar fazer login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm relative">
        <div className="w-full bg-card border border-border rounded-lg shadow-lg p-6 relative z-20">
            <div className="space-y-2 text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Acessar Sistema</h1>
                <p className="text-sm text-muted-foreground">
                {step === "email" ? "Qual é o seu e-mail?" : "Agora, sua senha secreta"}
                </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {step === "email" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-8 duration-300">
                        <div className="space-y-1">
                            <Input
                                label="E-mail"
                                type="email"
                                {...register("email")}
                                disabled={loading}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        e.preventDefault()
                                        handleNextStep()
                                    }
                                }}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">{errors.email.message}</p>
                            )}
                        </div>
                        <Button 
                            type="button" 
                            className="w-full" 
                            disabled={loading} 
                            onClick={handleNextStep}
                        >
                            {loading ? "Verificando..." : (
                                <>
                                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {step === "password" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                         <div className="space-y-1">
                            <Input
                                label="Senha"
                                type="password"
                                {...register("password")}
                                disabled={loading}
                                autoFocus
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password.message}</p>
                            )}
                        </div>
                        
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2">
                             <Button 
                                type="button" 
                                variant="outline" 
                                className="w-1/3"
                                onClick={() => {
                                    setStep("email")
                                    setError(null)
                                }}
                                disabled={loading}
                            >
                                Voltar
                            </Button>
                            <Button type="submit" className="w-2/3" disabled={loading}>
                                {loading ? (
                                    "Entrando..."
                                ) : (
                                    <>
                                        Entrar <LogIn className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
                 
                 {/* Email Error only for step 1 (shown below button usually, or handled above) */}
                 {step === "email" && error && (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                        {error}
                    </div>
                )}
            </form>
        </div>
    </div>
  )
}
