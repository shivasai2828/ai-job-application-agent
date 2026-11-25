"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import Field, { fieldClass, describedBy } from "./Field";

const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className, id, rows = 4, mono = false, ...props },
  ref
) {
  const autoId = useId();
  const areaId = id || autoId;

  return (
    <Field id={areaId} label={label} required={required} error={error} hint={hint} className={className}>
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(areaId, error, hint)}
        className={cn(fieldClass(error), "resize-y py-2", mono && "font-mono text-[13px] leading-relaxed")}
        {...props}
      />
    </Field>
  );
});

export default Textarea;
