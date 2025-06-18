import React from "react";

const VARIANT_CLASSES = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  danger: "bg-red-700 hover:bg-red-800 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  warning: "bg-yellow-700 hover:bg-yellow-800 text-white",
  info: "bg-cyan-700 hover:bg-cyan-800 text-white",
  accent: "bg-cyan-700 hover:bg-cyan-600 text-white",
  neutral: "bg-gray-700 hover:bg-gray-800 text-white",
};

const SIZE_CLASSES = {
  sm: "py-1 px-2 text-sm",
  md: "py-2 px-4 text-base",
  lg: "py-3 px-6 text-lg",
};

function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  ...props
}) {
  const base =
    "font-bold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 shadow";
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
