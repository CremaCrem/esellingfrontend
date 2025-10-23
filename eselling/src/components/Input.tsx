import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isRequired = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const inputId =
      props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const getInputStyles = () => {
      const baseStyles =
        "w-full h-12 px-4 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[48px]";

      if (hasError) {
        return `${baseStyles} border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500`;
      }

      return `${baseStyles} border-stone-300 bg-white focus:border-amber-500 focus:ring-amber-500`;
    };

    const getIconStyles = () => {
      if (hasError) {
        return "text-red-400";
      }
      return "text-stone-400";
    };

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-stone-700 mb-2"
          >
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className={getIconStyles()}>{leftIcon}</div>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={`${getInputStyles()} ${leftIcon ? "pl-10" : ""} ${
              rightIcon || hasError ? "pr-10" : ""
            } ${className}`}
            {...props}
          />

          {/* Right Icon or Error Icon */}
          {(rightIcon || hasError) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {hasError ? (
                <AlertCircle className="h-5 w-5 text-red-400" />
              ) : (
                <div className={getIconStyles()}>{rightIcon}</div>
              )}
            </div>
          )}
        </div>

        {/* Helper Text or Error */}
        {(helperText || error) && (
          <div className="mt-1">
            {error ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </p>
            ) : (
              <p className="text-sm text-stone-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
