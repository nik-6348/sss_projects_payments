import React from 'react';
import { FolderOpen, Plus, Eye, CheckCircle, Clock } from 'lucide-react';
import type { Project } from '../types';
import { GlassCard, PrimaryButton, StatusChip } from '../components/ui';
import { formatCurrency, formatDate } from '../utils';

interface ProjectsListPageProps {
  projects: Project[];
  onAddProject: () => void;
  onViewProject: (projectId: string) => void;
}

type TabType = 'all' | 'active' | 'completed';

export const ProjectsListPage: React.FC<ProjectsListPageProps> = ({
  projects,
  onAddProject,
  onViewProject
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('active');

  // Filter projects based on active tab
  const filteredProjects = React.useMemo(() => {
    switch (activeTab) {
      case 'active':
        return projects.filter(p => p.status === 'active' || p.status === 'on_hold');
      case 'completed':
        return projects.filter(p => p.status === 'completed');
      default:
        return projects;
    }
  }, [projects, activeTab]);

  // Calculate counts
  const counts = React.useMemo(() => {
    const all = projects.length;
    const active = projects.filter(p => p.status === 'active' || p.status === 'on_hold').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    return { all, active, completed };
  }, [projects]);

  const tabs = [
    { id: 'active' as TabType, label: 'Active', count: counts.active },
    { id: 'completed' as TabType, label: 'Completed', count: counts.completed },
    { id: 'all' as TabType, label: 'All Projects', count: counts.all },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Projects</h1>
        </div>
        <PrimaryButton onClick={onAddProject}>
          <Plus className="h-5 w-5" />
          Add Project
        </PrimaryButton>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50'
            }`}
          >
            {tab.id === 'active' && <Clock className="h-4 w-4" />}
            {tab.id === 'completed' && <CheckCircle className="h-4 w-4" />}
            <span>{tab.label}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              activeTab === tab.id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Projects Table */}
      <GlassCard>
        <div className="overflow-x-auto">
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
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <FolderOpen className="h-12 w-12 text-slate-300 dark:text-slate-500" />
                      <p className="text-lg font-medium">No projects found</p>
                      <p className="text-sm">Create your first project to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
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
      </GlassCard>
    </div>
  );
};
