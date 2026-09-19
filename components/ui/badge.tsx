import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-cyber-cyan/30 bg-cyber-cyan/10 text-cyber-cyan",
        critical: "border-cyber-red/40 bg-cyber-red/10 text-cyber-red",
        high: "border-orange-400/40 bg-orange-400/10 text-orange-300",
        medium: "border-cyber-amber/40 bg-cyber-amber/10 text-cyber-amber",
        low: "border-cyber-green/40 bg-cyber-green/10 text-cyber-green",
        outline: "border-cyber-border text-slate-400",
        violet: "border-cyber-violet/40 bg-cyber-violet/10 text-cyber-violet",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
