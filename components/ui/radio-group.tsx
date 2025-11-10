"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value: string;
  setValue: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({ defaultValue = "", value, onValueChange, children, className }: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <RadioGroupContext.Provider value={{ value: currentValue, setValue }}>
      <div role="radiogroup" className={cn("space-y-2", className)}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    if (!context) {
      throw new Error("RadioGroupItem must be used within RadioGroup");
    }

    const checked = context.value === value;

    return (
      <label className={cn("flex items-center space-x-2 text-sm", className)}>
        <input
          ref={ref}
          type="radio"
          value={value}
          checked={checked}
          onChange={() => context.setValue(value)}
          className="h-4 w-4"
          {...props}
        />
        <span>{children}</span>
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";
