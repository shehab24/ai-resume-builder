"use client";

import Select, { Props as SelectProps, StylesConfig } from "react-select";
import { useId } from "react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps extends Omit<SelectProps<Option, false>, 'styles' | 'instanceId'> {
  label?: string;
  error?: string;
}

const customStyles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    padding: "2px",
    borderRadius: "0.5rem", // rounded-lg
    borderColor: state.isFocused ? "hsl(var(--primary))" : "hsl(var(--input))",
    boxShadow: state.isFocused ? "0 0 0 1px hsl(var(--primary))" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "hsl(var(--primary))" : "hsl(var(--input))",
    },
    backgroundColor: "white",
    color: "hsl(var(--foreground))",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? "hsl(var(--primary))" 
      : state.isFocused 
        ? "hsl(var(--primary) / 0.1)" 
        : "transparent",
    color: state.isSelected ? "white" : "hsl(var(--foreground))",
    "&:active": {
      backgroundColor: "hsl(var(--primary))",
    },
    cursor: "pointer",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    backgroundColor: "white",
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  input: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
};

export function ReusableSelect({ label, error, ...props }: CustomSelectProps) {
  const instanceId = useId();

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <Select
        instanceId={instanceId}
        styles={customStyles}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
