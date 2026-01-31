import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1";

  const variantStyles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent",
    secondary:
      "bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400 border border-slate-300",
    danger:
      "bg-white text-red-600 hover:bg-red-50 focus:ring-red-400 border border-red-300",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400 border border-transparent",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-6 py-3 text-base rounded-xl gap-2",
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      style={{ whiteSpace: "nowrap" }}
      {...props}
    >
      {children}
    </button>
  );
}
