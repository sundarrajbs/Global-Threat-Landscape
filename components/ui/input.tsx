import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-cyber-border bg-cyber-panel2/80 px-3 py-1 text-sm text-slate-200 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyber-cyan focus-visible:border-cyber-cyan/50 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
