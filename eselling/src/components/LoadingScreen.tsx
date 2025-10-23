import React from "react";

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="mb-6">
          <div className="w-16 h-16 border-4 border-stone-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
        </div>

        {/* Loading text */}
        <div className="text-stone-600 text-lg font-medium">{message}</div>

        {/* Optional subtitle */}
        <div className="text-stone-400 text-sm mt-2">
          Please wait while we load your content...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
