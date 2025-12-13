import * as React from "react"

import { cn } from "@/lib/utils/helpers"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-border/50 bg-white px-3.5 py-2 text-sm text-[#151959] placeholder:text-[#94a3b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151959] focus-visible:ring-offset-2 focus-visible:border-[#151959] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

