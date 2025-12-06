import React from "react";

interface PrimaryButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  form?: string;
  loading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onClick,
  children,
  className = "",
  type = "button",
  disabled = false,
  form,
  loading = false,
}) => (
  <button
    onClick={onClick}
    type={type}
    disabled={disabled || loading}
    form={form}
    className={`flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-400 dark:hover:to-indigo-400 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
  >
    {loading ? (
      <>
        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
        <span>Saving...</span>
      </>
    ) : (
      children
    )}
  </button>
);
