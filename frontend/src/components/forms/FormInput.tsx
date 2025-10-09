import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, className = '', ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="text-sm font-medium text-slate-600 dark:text-white block">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full p-2 bg-white dark:bg-slate-700 dark:text-white border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition ${
        error ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
      } ${className}`}
    />
    {error && (
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    )}
  </div>
);
