import * as React from "react"
import { cn } from "@/utils"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    let variantClasses = "";

    if (variant === "default") {
      variantClasses = "bg-blue-500/20 text-blue-300 border-blue-500/30";
    } else if (variant === "secondary") {
      variantClasses = "bg-slate-500/20 text-slate-300 border-slate-500/30";
    } else if (variant === "destructive") {
      variantClasses = "bg-red-500/20 text-red-300 border-red-500/30";
    } else if (variant === "outline") {
      variantClasses = "bg-transparent text-slate-300 border-slate-500";
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          variantClasses,
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }