import React from 'react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  options = [],
  className = '',
  children,
  ...props
}) => (
  <div className="space-y-1">
    {label && (
      <label className="text-sm font-medium text-slate-600 dark:text-white block">
        {label}
      </label>
    )}
    <select
      {...props}
      className={`w-full p-2 bg-white dark:bg-slate-700 dark:text-white border rounded-md focus:ring-2 focus:ring-blue-500 outline-none transition ${
        error ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
      } ${className}`}
    >
      {children || options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    )}
  </div>
);
