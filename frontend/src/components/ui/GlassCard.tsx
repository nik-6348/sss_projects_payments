import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => (
  <div className={`bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-200/80 p-6 dark:bg-slate-800/40 dark:border-slate-600/50 ${className}`}>
    {children}
  </div >
);
