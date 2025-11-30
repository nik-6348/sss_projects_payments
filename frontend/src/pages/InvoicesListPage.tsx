import React from "react";
import {
  FileText,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  AlertCircle,
  Trash2,
  MoreVertical,
  Search,
  Send,
} from "lucide-react";
import type { Invoice, Project } from "../types";
import {
  GlassCard,
  PrimaryButton,
  StatusChip,
  ConfirmationModal,
  Pagination,
} from "../components/ui";
import SendInvoiceModal from "../components/modals/SendInvoiceModal";
import { formatCurrency, formatDate } from "../utils";

interface InvoicesListPageProps {
  invoices: Invoice[];
  projects?: Project[];
  onAddInvoice: () => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onViewPDF?: (invoiceId: string) => void;
  onMarkAsPaid?: (invoice: Invoice) => void;
  onInvoiceSent?: () => void;
}

type TabType = "all" | "overdue" | "paid";

export const InvoicesListPage: React.FC<InvoicesListPageProps> = ({
  invoices,
  projects,
  onAddInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onViewPDF,
  onMarkAsPaid,
  onInvoiceSent,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean;
    invoiceId: string | null;
    invoiceNumber: string;
  }>({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: "",
  });
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const [sendModal, setSendModal] = React.useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({
    isOpen: false,
    invoice: null,
  });

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Filter invoices based on active tab and search query
  const filteredInvoices = React.useMemo(() => {
    let filtered = invoices;

    // Status Filter
    switch (activeTab) {
      case "overdue":
        filtered = filtered.filter((i) => i.status === "overdue");
        break;
      case "paid":
        filtered = filtered.filter((i) => i.status === "paid");
        break;
      default:
        break;
    }

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((i) => {
        const project =
          typeof i.project_id === "string"
            ? projects?.find((p) => p.id === i.project_id)
            : i.project_id;
        const projectName = project?.name || "";

        return (
          i.invoice_number.toLowerCase().includes(query) ||
          projectName.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [invoices, activeTab, searchQuery, projects]);

  // Pagination Logic
  const paginatedInvoices = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  // Calculate counts
  const counts = React.useMemo(() => {
    const all = invoices.length;
    const overdue = invoices.filter((i) => i.status === "overdue").length;
    const paid = invoices.filter((i) => i.status === "paid").length;
    return { all, overdue, paid };
  }, [invoices]);

  const tabs = [
    {
      id: "all" as TabType,
      label: "All Invoices",
      count: counts.all,
      icon: FileText,
    },
    {
      id: "overdue" as TabType,
      label: "Overdue",
      count: counts.overdue,
      icon: AlertCircle,
    },
    {
      id: "paid" as TabType,
      label: "Paid",
      count: counts.paid,
      icon: CheckCircle,
    },
  ];

  const handleDeleteClick = (invoice: Invoice) => {
    setDeleteModal({
      isOpen: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.invoiceId && onDeleteInvoice) {
      onDeleteInvoice(deleteModal.invoiceId);
    }
    setDeleteModal({
      isOpen: false,
      invoiceId: null,
      invoiceNumber: "",
    });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      invoiceId: null,
      invoiceNumber: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            All Invoices
          </h1>
        </div>
        <PrimaryButton onClick={onAddInvoice}>
          <Plus className="h-5 w-5" />
          Add Invoice
        </PrimaryButton>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/20 dark:border-slate-700/30">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full md:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      <GlassCard>
        <div className="overflow-x-auto relative min-h-[400px]">
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
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-12 w-12 text-slate-300 dark:text-slate-500" />
                      <p className="text-lg font-medium">No invoices found</p>
                      <p className="text-sm">
                        {searchQuery
                          ? "Try adjusting your search terms"
                          : "Create your first invoice to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => {
                  // Handle both string project_id and nested project object
                  const project =
                    typeof invoice.project_id === "string"
                      ? projects?.find((p) => p.id === invoice.project_id)
                      : invoice.project_id;

                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-white/20 dark:border-slate-600/20 hover:bg-white/20 dark:hover:bg-slate-700/20 relative"
                    >
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {project?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {formatCurrency(invoice.amount, invoice.currency)}
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
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(
                                openDropdown === invoice.id ? null : invoice.id
                              );
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                          >
                            <MoreVertical className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                          </button>

                          {openDropdown === invoice.id && (
                            <div
                              className="fixed mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 z-50 right-0"
                              style={{ transform: "translateX(-10px)" }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSendModal({ isOpen: true, invoice });
                                  setOpenDropdown(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              >
                                <Send className="h-4 w-4" />
                                Send
                              </button>
                              {onViewPDF && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewPDF(invoice.id);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                  <Eye className="h-4 w-4" />
                                  View PDF
                                </button>
                              )}
                              {invoice.status !== "paid" && onMarkAsPaid && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsPaid(invoice);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Mark as Paid
                                </button>
                              )}
                              {invoice.status !== "paid" && onEditInvoice && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditInvoice(invoice);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Edit
                                </button>
                              )}
                              {invoice.status !== "paid" && onDeleteInvoice && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(invoice);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredInvoices.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          totalItems={filteredInvoices.length}
          itemsPerPage={itemsPerPage}
        />
      </GlassCard>

      {/* Send Invoice Modal */}
      {sendModal.isOpen && sendModal.invoice && (
        <SendInvoiceModal
          isOpen={sendModal.isOpen}
          invoice={sendModal.invoice}
          onClose={() => setSendModal({ isOpen: false, invoice: null })}
          onSuccess={() => {
            if (onInvoiceSent) onInvoiceSent();
          }}
        />
      )}

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
