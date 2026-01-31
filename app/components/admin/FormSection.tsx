import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className = "",
}: FormSectionProps) {
  return (
    <div className={`admin-form-section ${className}`}>
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="admin-form-title">{title}</h3>
        {description && (
          <p className="admin-form-desc">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
