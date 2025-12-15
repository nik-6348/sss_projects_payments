import React from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { GlassCard } from "../components/ui";
import { toast } from "react-toastify";
import apiClient from "../utils/api";

interface ResetPasswordPageProps {
  onNavigate: (view: string) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onNavigate,
}) => {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Extract token from URL path
    const pathParts = window.location.pathname.split("/");
    const tokenFromUrl = pathParts[pathParts.length - 1];
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      toast.error("Invalid reset link");
      onNavigate("login");
    }
  }, [onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!token) {
      toast.error("Invalid token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.resetPassword(token, password);

      if (response.success) {
        toast.success("Password reset successful! Please login.");
        onNavigate("login");
      } else {
        throw new Error(response.error || "Password reset failed");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage =
        error.response?.data?.error || error.message || "Password reset failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Reset Password
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 dark:text-white block">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 pr-10 bg-white dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-600 dark:text-white block">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};
