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
  isSearchable?: boolean;
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
      ? "black" 
      : state.isFocused 
        ? "#e5e7eb" 
        : "transparent",
    color: state.isSelected 
      ? "white" 
      : state.isFocused 
        ? "#111827" 
        : "hsl(var(--foreground))",
    "&:active": {
      backgroundColor: "black",
      color: "white",
    },
    cursor: "pointer",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    border: "1px solid hsl(var(--border))",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    backgroundColor: "white",
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
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

export function ReusableSelect({ label, error, isSearchable = true, ...props }: CustomSelectProps) {
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
        isSearchable={isSearchable}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        formatOptionLabel={(option: Option) => (
          <div dangerouslySetInnerHTML={{ __html: option.label }} />
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
