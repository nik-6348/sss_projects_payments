import React from "react";
import { X } from "lucide-react";

interface RemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remark: string) => void;
  title: string;
  message?: string;
  required?: boolean;
  confirmText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const RemarkModal: React.FC<RemarkModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  required = false,
  confirmText = "Confirm",
  type = "info",
  isLoading = false,
}) => {
  const [remark, setRemark] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setRemark("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !remark.trim()) {
      setError("Remark is required");
      return;
    }
    onConfirm(remark);
  };

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      default:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all scale-100 opacity-100">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {message}
            </p>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Remark {required && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] disabled:opacity-50"
                placeholder={
                  required ? "Enter a reason..." : "Optional remark..."
                }
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Email Preview Section */}
          <div className="border-t pt-4">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-700 dark:text-slate-200">
                <span>Preview Email Notification</span>
                <span className="transition group-open:rotate-180">
                  <svg
                    fill="none"
                    height="24"
                    shapeRendering="geometricPrecision"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {/* Note: In a real app we might need to fetch the full invoice if only ID passed, but for now assuming invoice prop has enough data or this is acceptable */}
                <p className="text-xs text-slate-400 mb-2">
                  Preview only available if full invoice data is present.
                </p>
              </div>
            </details>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-70 disabled:cursor-not-allowed ${getTypeStyles()}`}
            >
              {isLoading && (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              {isLoading
                ? "Processing..."
                : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RemarkModal;
