"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import Field, { fieldClass, describedBy } from "./Field";

// `className` styles the wrapper (use it for grid col-span etc.).
// `required` only shows the asterisk. Validate in your submit handler
// (use <form noValidate>) so we control the error messages.
const Input = forwardRef(function Input(
  { label, error, hint, required, className, id, type = "text", ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <Field id={inputId} label={label} required={required} error={error} hint={hint} className={className}>
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        className={cn(fieldClass(error), "h-10")}
        {...props}
      />
    </Field>
  );
});

export default Input;
