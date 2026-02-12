"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogIn, ArrowRight } from "lucide-react"
import { checkEmail } from "@/app/login/actions"
import { JCCharacter, JCState } from "@/components/ui/tecnico/jc-character"

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
  
  // JC Character State
  const [jcState, setJcState] = useState<JCState>("idle")
  const [lastActivity, setLastActivity] = useState(Date.now())

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange"
  })

  // Watch fields for JC interaction
  const emailValue = watch("email")
  const passwordValue = watch("password")

  // Idle timer for "pointing" state
  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now())
    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("keydown", handleActivity)

    const interval = setInterval(() => {
      const isIdle = Date.now() - lastActivity > 7000
      if (isIdle && jcState !== "pointing" && !loading) {
        setJcState("pointing")
      }
    }, 1000)

    return () => {
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      clearInterval(interval)
    }
  }, [lastActivity, jcState, loading])

  // Reset JC to following when active (unless specific states)
  useEffect(() => {
    if (jcState === "pointing") {
      setJcState("following")
    }
  }, [lastActivity])

  // Email typing effect
  useEffect(() => {
    if (step === "email" && emailValue) {
      // Small delay to simulate "following typing"
      setJcState("following") 
    }
  }, [emailValue, step])

  const handleNextStep = async () => {
    const isValid = await trigger("email")
    if (!isValid) {
      setJcState("facepalm")
      return
    }

    setLoading(true)
    setError(null)
    setJcState("following")

    try {
      const email = getValues("email")
      const result = await checkEmail(email)

      if (result.exists) {
        setJcState("happy")
        setTimeout(() => {
            setStep("password")
            setLoading(false)
            setJcState("hiding") // Prepare for password entry
            // Need to wait for render to focus password
            setTimeout(() => setFocus("password"), 100)
        }, 800)
      } else {
        setJcState("facepalm")
        setError("E-mail não encontrado.")
        setLoading(false)
      }
    } catch (err) {
      setJcState("facepalm")
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
        setJcState("facepalm")
        setError("Senha incorreta.")
      } else {
        setJcState("happy")
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setJcState("facepalm")
      setError("Ocorreu um erro ao tentar fazer login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm relative">
        {/* JC Character positioned above */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <JCCharacter state={jcState} />
        </div>

        <div className="w-full bg-white rounded-lg shadow-lg p-6 pt-10 mt-10 relative z-20">
            <div className="space-y-2 text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-primary">Acessar Fixit</h1>
                <p className="text-sm text-muted-foreground">
                {step === "email" ? "Qual é o seu e-mail?" : "Agora, sua senha secreta"}
                </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {step === "email" && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Input
                                label="E-mail"
                                type="email"
                                {...register("email")}
                                disabled={loading}
                                onFocus={() => setJcState("following")}
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
                                onFocus={() => setJcState("hiding")}
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
                                    setJcState("following")
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
