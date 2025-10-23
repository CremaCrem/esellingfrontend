import React from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import Modal from "./Modal";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
  isLoading = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: AlertCircle,
          iconColor: "text-red-500",
          iconBg: "bg-red-50",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          border: "border-red-200",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-amber-500",
          iconBg: "bg-amber-50",
          confirmButton: "bg-amber-600 hover:bg-amber-700 text-white",
          border: "border-amber-200",
        };
      default:
        return {
          icon: Info,
          iconColor: "text-sky-500",
          iconBg: "bg-sky-50",
          confirmButton: "bg-sky-600 hover:bg-sky-700 text-white",
          border: "border-sky-200",
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = styles.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdropClick={!isLoading}
    >
      <div className="text-center">
        {/* Icon */}
        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} mb-4`}
        >
          <IconComponent className={`h-6 w-6 ${styles.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-stone-800 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              styles.confirmButton
            } ${
              variant === "danger"
                ? "focus:ring-red-500"
                : variant === "warning"
                ? "focus:ring-amber-500"
                : "focus:ring-sky-500"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
