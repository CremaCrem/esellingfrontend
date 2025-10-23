import React from "react";
import { motion } from "framer-motion";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "outlined" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  clickable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  clickable = false,
  className = "",
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "outlined":
        return "bg-white border border-stone-200";
      case "elevated":
        return "bg-white shadow-lg";
      default:
        return "bg-white border border-stone-200 shadow-sm";
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case "none":
        return "";
      case "sm":
        return "p-4";
      case "md":
        return "p-6";
      case "lg":
        return "p-8";
      default:
        return "p-6";
    }
  };

  const getHoverStyles = () => {
    if (hover || clickable) {
      return "hover:shadow-md hover:border-stone-300 transition-all duration-200";
    }
    return "";
  };

  const getClickableStyles = () => {
    if (clickable) {
      return "cursor-pointer";
    }
    return "";
  };

  const baseStyles = "rounded-xl";

  const cardStyles = `${baseStyles} ${getVariantStyles()} ${getPaddingStyles()} ${getHoverStyles()} ${getClickableStyles()} ${className}`;

  if (hover || clickable) {
    const {
      onDrag,
      onDragEnd,
      onDragStart,
      onAnimationStart,
      onAnimationEnd,
      onAnimationIteration,
      ...motionProps
    } = props;
    return (
      <motion.div
        whileHover={hover ? { scale: 1.02 } : {}}
        whileTap={clickable ? { scale: 0.98 } : {}}
        className={cardStyles}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cardStyles} {...props}>
      {children}
    </div>
  );
};

export default Card;
