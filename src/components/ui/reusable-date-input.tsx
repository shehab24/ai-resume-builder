"use client";

import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface ReusableDateInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
}

export function ReusableDateInput({ label, error, className, ...props }: ReusableDateInputProps) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <Label className={cn(error && "text-red-500")}>
          {label}
        </Label>
      )}
      <Input
        type="date"
        className={cn(
          "w-full cursor-pointer",
          error && "border-red-500 focus-visible:ring-red-500/50",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
