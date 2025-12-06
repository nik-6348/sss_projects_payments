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
            className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <p className="text-slate-600 dark:text-slate-300">{message}</p>
          )}

          <div className="space-y-2">
            <label
              htmlFor="remark"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Remark {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id="remark"
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                if (error) setError("");
              }}
              rows={3}
              className={`w-full px-4 py-2 rounded-xl border ${
                error
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 dark:border-slate-600 focus:ring-blue-500"
              } bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all resize-none`}
              placeholder={
                required ? "Enter a reason..." : "Optional remark..."
              }
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${getTypeStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
