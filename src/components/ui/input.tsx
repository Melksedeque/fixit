import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, startIcon, endIcon, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="relative">
        <input
          type={type}
          id={inputId}
          className={cn(
            "peer flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:shadow-[var(--inner-soft)] focus-visible:shadow-[var(--inner-soft)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 ease-out",
            startIcon ? "pl-9" : "",
            endIcon ? "pr-9" : "",
            className
          )}
          placeholder={label || "Input"}
          ref={ref}
          {...props}
        />
        {startIcon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {startIcon}
          </span>
        )}
        {endIcon && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {endIcon}
          </span>
        )}
        {label && (
          <label
            htmlFor={inputId}
            className="absolute left-3 top-2 z-10 origin-left -translate-y-4 scale-75 transform bg-background px-2 text-sm text-muted-foreground duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-primary"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
