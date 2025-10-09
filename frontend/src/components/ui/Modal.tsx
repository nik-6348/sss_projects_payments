import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, actions }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center p-2 sm:p-4 bg-slate-900/40 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-white/30 dark:border-slate-600/50 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header  */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30">
          <div className="flex items-center justify-between">
            {title && (
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 ml-4 flex-shrink-0"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>

        {/* Modal Footer  */}
        {actions && (
          <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-700/30">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              {actions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
