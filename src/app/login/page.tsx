import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/ui/logo"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex justify-center mb-4">
          <Logo width={180} className="" />
        </div>
      </div>
      <LoginForm />
    </div>
  )
}
