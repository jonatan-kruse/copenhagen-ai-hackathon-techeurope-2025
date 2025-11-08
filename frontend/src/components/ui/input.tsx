import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input/50 file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground aria-invalid:outline-destructive/60 aria-invalid:ring-destructive/20 ring-ring/10 outline-ring/50 aria-invalid:border-destructive/60 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-destructive/20 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
