import * as React from "react"
import { cn } from "@/utils"

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={cn("rounded-lg border border-slate-700 bg-slate-900 text-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <div className={cn("text-xl font-semibold leading-none tracking-tight text-white", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div className={cn("p-6 pt-0", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)}>
      {children}
    </div>
  );
}