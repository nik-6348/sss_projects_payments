import React from "react";
import {
  LayoutDashboard,
  Eye,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import type { Project, Payment, ProjectWithStats } from "../types";
import { GlassCard, StatusChip } from "../components/ui";
import { formatCurrency, calculateProjectStats } from "../utils";

interface DashboardPageProps {
  projects: Project[];
  payments: Payment[];
  invoices: any[]; // Invoice type from types
  onViewProject: (projectId: string) => void;
  onNavigate: (view: string, id?: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  payments,
  invoices,
  onViewProject,
  onNavigate,
}) => {
  const activeProjects = projects.filter(
    (p) => p.status === "active" || p.status === "on_hold"
  );

  const getProjectStats = (project: Project): ProjectWithStats => {
    return calculateProjectStats(project, payments, invoices);
  };

  const dashboardStats = React.useMemo(() => {
    const totalRevenue = projects.reduce((sum, p) => sum + p.total_amount, 0);
    const totalPaidFromPayments = payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const totalPaidFromInvoices = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.amount, 0);

    const totalPaid = totalPaidFromPayments + totalPaidFromInvoices;
    const totalDue = totalRevenue - totalPaid;
    const activeProjectsCount = projects.filter(
      (p) => p.status === "active"
    ).length;
    const completedProjectsCount = projects.filter(
      (p) => p.status === "completed"
    ).length;
    const overdueInvoices = invoices.filter(
      (i) => i.status === "overdue"
    ).length;

    return {
      totalProjects: projects.length,
      activeProjects: activeProjectsCount,
      totalRevenue,
      totalPaid,
      totalDue,
      overdueInvoices,
      completedProjects: completedProjectsCount,
    };
  }, [projects, payments, invoices]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-8 w-8 text-slate-600 dark:text-slate-300" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Dashboard
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="!p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Active Projects
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {dashboardStats.activeProjects}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <button
            onClick={() => onNavigate("projects")}
            className="w-full mt-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-3 w-3" /> View Projects
          </button>
        </GlassCard>

        <GlassCard className="!p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Invoiced
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {formatCurrency(dashboardStats.totalRevenue)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
          <button
            onClick={() => onNavigate("invoices")}
            className="w-full mt-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-3 w-3" /> View Invoices
          </button>
        </GlassCard>

        <GlassCard className="!p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Paid
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(dashboardStats.totalPaid)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <button
            onClick={() => onNavigate("invoices", undefined, { tab: "paid" })}
            className="w-full mt-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-3 w-3" /> View Paid Invoices
          </button>
        </GlassCard>

        <GlassCard className="!p-4 relative group">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Due
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(dashboardStats.totalDue)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <button
            onClick={() =>
              onNavigate("invoices", undefined, { tab: "overdue" })
            }
            className="w-full mt-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="h-3 w-3" /> View Overdue
          </button>
        </GlassCard>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-700 dark:text-white">
          <CheckCircle className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          Active Projects Status
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeProjects.map((project) => {
            const stats = getProjectStats(project);

            return (
              <GlassCard key={project.id}>
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
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-2 text-slate-600 dark:text-white">
                    <span>Progress</span>
                    <span>{Math.round(stats.progress)}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 space-y-2 border-t border-white/30 dark:border-slate-600/30">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-white">
                      Paid:
                    </span>
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {formatCurrency(stats.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-white">Due:</span>
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      {formatCurrency(stats.dueAmount)}
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
