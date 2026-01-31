import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  error,
  description,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="admin-label flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">{children}</div>
      {description && (
        <span className="admin-helper-text mt-1 block">{description}</span>
      )}
      {error && (
        <span className="admin-error-text">{error}</span>
      )}
    </div>
  );
}
