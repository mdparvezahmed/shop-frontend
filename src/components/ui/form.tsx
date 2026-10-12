import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form primitives. Wrap an input in <Field> to get a label, hint and error:
 *
 *   <Field label="Phone" error={errors.phone} hint="We'll call before delivery">
 *     <Input name="phone" />
 *   </Field>
 */

const control =
  "w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-sale";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, "h-10", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 4, ...props },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(control, "py-2 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(control, "h-10 appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
});

export function Label({ children, htmlFor, required, className }: { children: ReactNode; htmlFor?: string; required?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium", className)}>
      {children}
      {required && <span className="ml-0.5 text-sale">*</span>}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | string[];
  className?: string;
  children: ReactNode;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {message ? (
        <p className="mt-1 text-xs text-sale">{message}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm select-none", className)}>
      <input type="checkbox" className="size-4 cursor-pointer rounded border-input accent-[var(--primary)]" {...props} />
      {label}
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4", disabled && "cursor-not-allowed opacity-60")}>
      {(label || description) && (
        <span className="text-sm">
          {label && <span className="block font-medium">{label}</span>}
          {description && <span className="block text-xs text-muted-foreground">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
          checked ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-background shadow transition",
            checked ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
