import React from 'react';
import { FileText, Plus, Edit2, Eye, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import type { Invoice, Project } from '../types';
import { GlassCard, PrimaryButton, StatusChip, ConfirmationModal } from '../components/ui';
import { formatCurrency, formatDate } from '../utils';

interface InvoicesListPageProps {
  invoices: Invoice[];
  projects?: Project[]; // Made optional since project data can be nested in invoice
  onAddInvoice: () => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onViewInvoice?: (invoiceId: string) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

type TabType = 'all' | 'overdue' | 'paid';

export const InvoicesListPage: React.FC<InvoicesListPageProps> = ({
  invoices,
  projects,
  onAddInvoice,
  onEditInvoice,
  onViewInvoice,
  onDeleteInvoice
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('all');
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean;
    invoiceId: string | null;
    invoiceNumber: string;
  }>({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: ''
  });

  // Filter invoices based on active tab
  const filteredInvoices = React.useMemo(() => {
    switch (activeTab) {
      case 'overdue':
        return invoices.filter(i => i.status === 'overdue');
      case 'paid':
        return invoices.filter(i => i.status === 'paid');
      default:
        return invoices;
    }
  }, [invoices, activeTab]);

  // Calculate counts
  const counts = React.useMemo(() => {
    const all = invoices.length;
    const overdue = invoices.filter(i => i.status === 'overdue').length;
    const paid = invoices.filter(i => i.status === 'paid').length;
    return { all, overdue, paid };
  }, [invoices]);

  const tabs = [
    { id: 'all' as TabType, label: 'All Invoices', count: counts.all, icon: FileText },
    { id: 'overdue' as TabType, label: 'Overdue', count: counts.overdue, icon: AlertCircle },
    { id: 'paid' as TabType, label: 'Paid', count: counts.paid, icon: CheckCircle },
  ];

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">All Invoices</h1>
        </div>
        <PrimaryButton onClick={onAddInvoice}>
          <Plus className="h-5 w-5" />
          Add Invoice
        </PrimaryButton>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase border-b border-white/30 dark:border-slate-600/30">
              <tr>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(invoice => {
                // Handle both string project_id and nested project object
                const project = typeof invoice.project_id === 'string' 
                  ? projects?.find(p => p.id === invoice.project_id)
                  : invoice.project_id;

                return (
                  <tr key={invoice.id} className="border-b border-white/20 dark:border-slate-600/20 hover:bg-white/20 dark:hover:bg-slate-700/20">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {project?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {formatDate(invoice.due_date)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {onViewInvoice && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewInvoice(invoice.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        )}
                        {onEditInvoice && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditInvoice(invoice);
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
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
                );
              })}
            </tbody>
          </table>
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
