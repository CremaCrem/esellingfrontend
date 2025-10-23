import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 shadow-sm";
      case "secondary":
        return "bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-500 shadow-sm";
      case "outline":
        return "border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 focus:ring-stone-500";
      case "ghost":
        return "bg-transparent hover:bg-stone-100 text-stone-700 focus:ring-stone-500";
      case "danger":
        return "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-sm";
      default:
        return "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 shadow-sm";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-3 py-2 text-sm min-h-[36px]";
      case "md":
        return "px-4 py-2 text-sm min-h-[40px]";
      case "lg":
        return "px-6 py-3 text-base min-h-[48px]";
      default:
        return "px-4 py-2 text-sm min-h-[40px]";
    }
  };

  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      disabled={isDisabled}
      {...(props as any)}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin h-4 w-4 mr-2" />
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

export default Button;
