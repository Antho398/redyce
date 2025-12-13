import { cn } from "@/lib/utils/helpers"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#f8f9fd]", className)}
      {...props}
    />
  )
}

export { Skeleton }

