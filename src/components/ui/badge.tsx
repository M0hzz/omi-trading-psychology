import * as React from "react"
import { cn } from "@/utils"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  let variantClasses = "";

  if (variant === "default") {
    variantClasses = "border-transparent bg-blue-600 text-white hover:bg-blue-700";
  } else if (variant === "secondary") {
    variantClasses = "border-transparent bg-slate-800 text-slate-300 hover:bg-slate-700";
  } else if (variant === "outline") {
    variantClasses = "text-slate-300 border-slate-600";
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses,
        className
      )}
      {...props}
    />
  )
}

export { Badge }