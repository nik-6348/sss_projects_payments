import React from 'react';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import type { Project, Invoice, Payment } from '../types';
import { GlassCard, PrimaryButton, StatusChip, ConfirmationModal } from '../components/ui';
import { formatCurrency, formatDate } from '../utils';

interface ProjectDetailPageProps {
  project: Project;
  invoices: Invoice[];
  payments: Payment[];
  onEditProject: (project: Project) => void;
  onAddInvoice: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  invoices,
  payments,
  onEditProject,
  onAddInvoice,
  onDeleteProject,
  onEditInvoice,
  onDeleteInvoice
}) => {
  const [activeTab, setActiveTab] = React.useState<'details' | 'invoices'>('details');
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean;
    invoiceId: string | null;
    invoiceNumber: string;
  }>({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: ''
  });

  const paidAmount = React.useMemo(() => {
    // Calculate from actual payments if available
    const paymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // If no payments but invoices are marked as paid, calculate from paid invoices
    if (paymentAmount === 0) {
      return invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);
    }
    
    return paymentAmount;
  }, [payments, invoices]);

  const dueAmount = project.total_amount - paidAmount;

  const handleDeleteClick = (invoice: Invoice) => {
    setDeleteModal({
      isOpen: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.invoiceId && onDeleteInvoice) {
      onDeleteInvoice(deleteModal.invoiceId);
    }
    setDeleteModal({
      isOpen: false,
      invoiceId: null,
      invoiceNumber: ''
    });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      invoiceId: null,
      invoiceNumber: ''
    });
  };

  const TabButton: React.FC<{
    tabName: 'details' | 'invoices';
    label: string;
  }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        activeTab === tabName
          ? 'bg-white/60 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100 shadow'
          : 'text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-600/30'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{project.name}</h1>
            <p className="text-slate-600 dark:text-slate-300">{project.client_name}</p>
          </div>
        </div>
        <StatusChip status={project.status} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="!p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Total Value</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(project.total_amount, project.currency)}
          </div>
        </GlassCard>
        <GlassCard className="!p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Total Paid</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatCurrency(paidAmount, project.currency)}
          </div>
        </GlassCard>
        <GlassCard className="!p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Total Due</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {formatCurrency(dueAmount, project.currency)}
          </div>
        </GlassCard>
      </div>

      {/* Tabbed Content */}
      <GlassCard>
        <div className="flex justify-between items-center mb-4 border-b border-white/30 dark:border-slate-600/30 pb-4">
          <div className="flex items-center gap-2 p-1 bg-slate-200/50 dark:bg-slate-600/50 rounded-lg">
            <TabButton tabName="details" label="Details" />
            <TabButton tabName="invoices" label="Invoices" />
          </div>
          {activeTab === 'invoices' && (
            <PrimaryButton onClick={() => onAddInvoice(project.id)}>
              <Plus className="h-4 w-4" />
              Add Invoice
            </PrimaryButton>
          )}
        </div>

        <div className="min-h-[200px]">
          {activeTab === 'details' && (
            <div className="space-y-4 text-slate-700 dark:text-slate-200">
              <div>
                <strong className="text-slate-800 dark:text-slate-100">Description:</strong>{' '}
                {project.description || 'N/A'}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-slate-100">Start Date:</strong>{' '}
                {formatDate(project.start_date)}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-slate-100">End Date:</strong>{' '}
                {formatDate(project.end_date)}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-slate-100">Notes:</strong>{' '}
                {project.notes || 'N/A'}
              </div>

              <div className="pt-4 flex gap-4">
                <PrimaryButton onClick={() => onEditProject(project)}>
                  <Edit className="h-4 w-4" />
                  Edit Details
                </PrimaryButton>
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </button>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase border-b border-white/30 dark:border-slate-600/30">
                  <tr>
                    <th className="px-6 py-3">Invoice #</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="border-b border-white/20 dark:border-slate-600/20">
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusChip status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {onEditInvoice && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditInvoice(invoice);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </button>
                          )}
                          {onDeleteInvoice && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(invoice);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteModal.invoiceNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  );
};
