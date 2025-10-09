import React from 'react';
import { statusConfig } from '../../utils';

interface StatusChipProps {
  status: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '' }) => {
  const config = statusConfig[status as keyof typeof statusConfig];

  if (!config) {
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ${className}`}>
        Unknown
      </span>
    );
  }

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${config.classes} ${className}`}>
      {config.text}
    </span>
  );
};
