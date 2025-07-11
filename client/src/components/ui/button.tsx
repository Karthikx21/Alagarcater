import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-dark active:scale-[0.98] shadow-sm hover:shadow-md font-semibold",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] shadow-sm hover:shadow-md font-semibold",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-[0.98] dark:border-primary dark:bg-transparent dark:hover:bg-primary/20 dark:hover:text-primary-foreground shadow-sm hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] shadow-sm hover:shadow-md font-semibold",
        ghost: "hover:bg-accent hover:text-accent-foreground border border-transparent hover:border-input",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        success: "bg-success text-success-foreground hover:bg-success/90 active:scale-[0.98] shadow-sm hover:shadow-md font-semibold",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 active:scale-[0.98] shadow-sm hover:shadow-md font-semibold",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 py-2 text-xs",
        lg: "h-12 rounded-md px-8 py-3 text-base",
        icon: "h-10 w-10",
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
