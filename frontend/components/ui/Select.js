"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import Field, { fieldClass, describedBy } from "./Field";

// Either pass `options=[{ value, label }]` or put <option> children.
// Pass `placeholder` (string) to render an empty first option.
const Select = forwardRef(function Select(
  { label, error, hint, required, className, id, options, placeholder, children, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <Field id={selectId} label={label} required={required} error={error} hint={hint} className={className}>
      <select
        ref={ref}
        id={selectId}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, error, hint)}
        className={cn(fieldClass(error), "h-10")}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options
          ? options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          : children}
      </select>
    </Field>
  );
});

export default Select;
