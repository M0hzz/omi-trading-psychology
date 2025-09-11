import * as React from "react"
import { cn } from "@/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    let variantClasses = "";
    let sizeClasses = "";

    // Variant styles
    if (variant === "default") {
      variantClasses = "bg-blue-600 text-white hover:bg-blue-700";
    } else if (variant === "outline") {
      variantClasses = "border border-slate-600 bg-transparent hover:bg-slate-800 text-slate-300";
    } else if (variant === "ghost") {
      variantClasses = "hover:bg-slate-800 text-slate-300";
    }

    // Size styles
    if (size === "default") {
      sizeClasses = "h-10 px-4 py-2";
    } else if (size === "sm") {
      sizeClasses = "h-9 rounded-md px-3";
    } else if (size === "lg") {
      sizeClasses = "h-11 rounded-md px-8";
    } else if (size === "icon") {
      sizeClasses = "h-10 w-10";
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          variantClasses,
          sizeClasses,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }