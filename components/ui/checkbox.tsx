"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "h-4 w-4 rounded border border-input bg-transparent text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className
        )}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";
