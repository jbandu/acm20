"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleContextValue {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(
  null
);

export interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Collapsible({ open: controlledOpen, onOpenChange, children }: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = React.useCallback(() => {
    const newOpen = !open;
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange, open]);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <CollapsibleContext.Provider value={{ open, toggle, setOpen }}>
      <div className="space-y-2">{children}</div>
    </CollapsibleContext.Provider>
  );
}

export interface CollapsibleTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    if (!context) {
      throw new Error("CollapsibleTrigger must be used within Collapsible");
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        onClick: (event: React.MouseEvent) => {
          children.props.onClick?.(event);
          context.toggle();
        },
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={context.toggle}
        aria-expanded={context.open}
        className={cn("w-full text-left", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    if (!context) {
      throw new Error("CollapsibleContent must be used within Collapsible");
    }

    if (!context.open) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      />
    );
  }
);
CollapsibleContent.displayName = "CollapsibleContent";
