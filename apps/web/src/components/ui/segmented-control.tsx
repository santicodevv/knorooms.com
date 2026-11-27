"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SegmentedOption = { value: string; label: ReactNode; disabled?: boolean };
export type SegmentedControlProps = Omit<ComponentProps<"fieldset">, "onChange"> & {
  name: string;
  label: string;
  options: readonly SegmentedOption[];
  value: string;
  onValueChange: (value: string) => void;
};

export function SegmentedControl({
  name,
  label,
  options,
  value,
  onValueChange,
  className,
  disabled,
  ...props
}: SegmentedControlProps) {
  return (
    <fieldset
      {...props}
      disabled={disabled}
      data-ui="segmented-control"
      className={cn(
        "bg-school-subtle inline-flex min-w-0 flex-wrap gap-1 rounded-xl p-1",
        className,
      )}
    >
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label key={option.value} className="relative flex cursor-pointer items-center">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={() => onValueChange(option.value)}
            className="peer sr-only"
          />
          <span className="text-school-button text-school-secondary peer-checked:bg-school-surface peer-checked:text-school-ink peer-focus-visible:outline-school-ink rounded-school-segment px-4.5 py-2 leading-[18px] font-medium peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
