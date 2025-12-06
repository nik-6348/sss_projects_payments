import React from "react";
import {
  LayoutDashboard,
  Eye,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Calendar,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { Project, Payment, ProjectWithStats } from "../types";
import { GlassCard, StatusChip } from "../components/ui";
import { formatCurrency, calculateProjectStats } from "../utils";
import apiClient from "../utils/api";
import type { DashboardStats } from "../utils/api";

interface DashboardPageProps {
  projects: Project[];
  payments: Payment[];
  invoices: any[];
  onViewProject: (projectId: string) => void;
  onNavigate: (view: string, id?: string, params?: any) => void;
}

const MONTHS = [
  { value: null, label: "All Months" },
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  payments,
  invoices,
  onViewProject,
  onNavigate,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(null);
  const [availableYears, setAvailableYears] = React.useState<number[]>([
    currentYear,
  ]);
  const [dashboardStats, setDashboardStats] =
    React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Fetch dashboard stats when filters change
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getDashboardStats({
          year: selectedYear,
          month: selectedMonth || undefined,
        });
        if (response.success && response.data) {
          setDashboardStats(response.data);
          if (response.data.availableYears.length > 0) {
            setAvailableYears(response.data.availableYears);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedYear, selectedMonth]);

  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "on_hold"
  );

  const getProjectStats = (project: Project): ProjectWithStats => {
    return calculateProjectStats(project, payments, invoices);
  };

  // Use stats from API or fallback to local calculation
  const stats = dashboardStats?.stats;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Dashboard
          </h1>
        </div>

        {/* Year/Month Filters */}
        <div className="flex items-center gap-3">
          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium 
                bg-white dark:bg-slate-800 
                text-slate-700 dark:text-slate-200
                border border-slate-200 dark:border-slate-700
                shadow-sm hover:shadow-md transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                cursor-pointer"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  Session-{year}
                </option>
              ))}
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth ?? ""}
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="appearance-none pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium 
                bg-white dark:bg-slate-800 
                text-slate-700 dark:text-slate-200
                border border-slate-200 dark:border-slate-700
                shadow-sm hover:shadow-md transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                cursor-pointer min-w-[140px]"
            >
              {MONTHS.map((month) => (
                <option key={month.label} value={month.value ?? ""}>
                  {month.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Loading indicator */}
          {loading && (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard
          className="!p-4 relative group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          onClick={() => onNavigate("projects")}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Active Projects
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {loading ? "..." : stats?.projects.active ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="w-full mt-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" /> View Projects
          </div>
        </GlassCard>

        <GlassCard
          className="!p-4 relative group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          onClick={() => onNavigate("invoices")}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Invoiced
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {loading
                  ? "..."
                  : formatCurrency(stats?.summary?.totalRevenue ?? 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
          <div className="w-full mt-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" /> View Invoices
          </div>
        </GlassCard>

        <GlassCard
          className="!p-4 relative group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          onClick={() => onNavigate("invoices", undefined, { tab: "paid" })}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Paid
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {loading
                  ? "..."
                  : formatCurrency(stats?.summary?.totalPaid ?? 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="w-full mt-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" /> View Paid Invoices
          </div>
        </GlassCard>

        <GlassCard
          className="!p-4 relative group cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          onClick={() => onNavigate("invoices", undefined, { tab: "overdue" })}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Due
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {loading
                  ? "..."
                  : formatCurrency(stats?.summary?.totalDue ?? 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="w-full mt-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" /> View Overdue
          </div>
        </GlassCard>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-700 dark:text-white">
          <CheckCircle className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          Active Projects Status
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeProjects.map((project) => {
            const projectStats = getProjectStats(project);

            return (
              <GlassCard
                key={project.id}
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                <div
                  className="flex justify-between items-start"
                  onClick={() => onViewProject(project.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                      {project.name}
                    </h3>
                    <p className="text-sm mb-1 text-slate-600 dark:text-white">
                      {project.client_name}
                    </p>
                    <StatusChip status={project.status} />
                  </div>
                  <button
                    onClick={() => onViewProject(project.id)}
                    className="flex items-center gap-1 p-2 transition-colors text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    aria-label="View project"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View</span>
                  </button>
                </div>

                <div className="mt-4">
                  <div className="w-full rounded-full h-2.5 bg-slate-200/50 dark:bg-slate-700/50">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${projectStats.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-2 text-slate-600 dark:text-white">
                    <span>Progress</span>
                    <span>{Math.round(projectStats.progress)}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 space-y-2 border-t border-white/30 dark:border-slate-600/30">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-white">
                      Paid:
                    </span>
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatCurrency(projectStats.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-white">Due:</span>
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      {formatCurrency(projectStats.dueAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-md">
                    <span className="font-bold text-slate-600 dark:text-white">
                      Total:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {formatCurrency(project.total_amount)}
                    </span>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
