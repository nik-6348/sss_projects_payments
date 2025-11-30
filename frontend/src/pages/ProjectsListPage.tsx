import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  Search,
} from "lucide-react";
import type { Project } from "../types";
import {
  GlassCard,
  PrimaryButton,
  StatusChip,
  Pagination,
} from "../components/ui";
import { formatCurrency, formatDate } from "../utils";
import { useDebounce } from "../hooks/useDebounce";

interface ProjectsListPageProps {
  projects: Project[];
  onAddProject: () => void;
  onViewProject: (projectId: string) => void;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (status: string) => void;
}

type TabType = "all" | "active" | "completed";

export const ProjectsListPage: React.FC<ProjectsListPageProps> = ({
  projects,
  onAddProject,
  onViewProject,
  isLoading = false,
  pagination = { currentPage: 1, totalPages: 1, totalItems: 0 },
  onPageChange,
  onSearch,
  onFilterChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Effect for search debounce
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (onFilterChange) {
      onFilterChange(tab === "all" ? "" : tab);
    }
  };

  const tabs = [
    { id: "active" as TabType, label: "Active" },
    { id: "completed" as TabType, label: "Completed" },
    { id: "all" as TabType, label: "All Projects" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Projects
          </h1>
        </div>
        <PrimaryButton onClick={onAddProject}>
          <Plus className="h-5 w-5" />
          Add Project
        </PrimaryButton>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/20 dark:border-slate-700/30">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full md:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50"
              }`}
            >
              {tab.id === "active" && <Clock className="h-3 w-3" />}
              {tab.id === "completed" && <CheckCircle className="h-3 w-3" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Projects Table */}
      <GlassCard>
        <div className="overflow-x-auto relative min-h-[200px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase border-b border-white/30 dark:border-slate-600/30">
              <tr>
                <th className="px-6 py-3">Project Name</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Total Amount</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">End Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FolderOpen className="h-12 w-12 text-slate-300 dark:text-slate-500" />
                      <p className="text-lg font-medium">No projects found</p>
                      <p className="text-sm">
                        {searchQuery
                          ? "Try adjusting your search terms"
                          : "Create your first project to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-white/20 dark:border-slate-600/20 hover:bg-white/30 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                    onClick={() => onViewProject(project.id)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {project.client_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {formatCurrency(project.total_amount, project.currency)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {formatDate(project.start_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {formatDate(project.end_date)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={project.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProject(project.id);
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange || (() => {})}
          totalItems={pagination.totalItems}
          itemsPerPage={10}
        />
      </GlassCard>
    </div>
  );
};
