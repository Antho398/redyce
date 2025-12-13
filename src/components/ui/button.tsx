import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/helpers"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151959] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#151959] text-white hover:bg-[#1c2270] active:bg-[#151959] shadow-[0_2px_10px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(21,25,89,0.15)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-[0_2px_10px_rgba(0,0,0,0.05)]",
        outline: "border border-border/50 bg-white hover:bg-[#f8f9fd] hover:border-[#151959]/20 text-[#151959] shadow-sm",
        secondary: "bg-[#f8f9fd] text-[#151959] hover:bg-white border border-border/30 shadow-sm",
        ghost: "hover:bg-[#f8f9fd] hover:text-[#151959] text-[#64748b]",
        accent: "bg-[#E3E7FF] text-[#151959] hover:bg-[#E3E7FF]/80 active:bg-[#E3E7FF] border border-[#151959]/10 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm rounded-xl",
        lg: "h-12 px-8 text-base rounded-xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

