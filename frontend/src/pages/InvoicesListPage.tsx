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
  Copy,
} from "lucide-react";
import type { Invoice, Project } from "../types";
import {
  GlassCard,
  PrimaryButton,
  StatusChip,
  Pagination,
} from "../components/ui";
import SendInvoiceModal from "../components/modals/SendInvoiceModal";
import { formatCurrency, formatDate } from "../utils";

import { useOnClickOutside } from "../hooks/useOnClickOutside";

interface InvoicesListPageProps {
  invoices: Invoice[];
  projects?: Project[];
  isLoading?: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
  onFilterChange: (status: string) => void;
  onAddInvoice: () => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onDuplicateInvoice?: (invoiceId: string) => void;
  onViewPDF?: (invoiceId: string) => void;
  onUpdateStatus?: (invoice: Invoice, status: string) => void;
  onInvoiceSent?: () => void;
  initialTab?: string;
}

type TabType =
  | "all"
  | "draft"
  | "sent"
  | "overdue"
  | "paid"
  | "cancelled"
  | "deleted";

export const InvoicesListPage: React.FC<InvoicesListPageProps> = ({
  invoices,
  projects,
  isLoading,
  pagination,
  onPageChange,
  onSearch,
  onFilterChange,
  onAddInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onDuplicateInvoice,
  onViewPDF,
  onUpdateStatus,
  onInvoiceSent,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>(
    (initialTab as TabType) || "all"
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  // Additional Filters State
  const [projectTypeFilter, setProjectTypeFilter] = React.useState("");
  const [allocationTypeFilter, setAllocationTypeFilter] = React.useState("");

  // Effect to handle initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as TabType);
      onFilterChange(initialTab === "all" ? "" : initialTab);
    }
  }, [initialTab, onFilterChange]);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    onFilterChange(tab === "all" ? "" : tab);
  };

  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef as React.RefObject<HTMLElement>, () =>
    setOpenDropdown(null)
  );

  const [sendModal, setSendModal] = React.useState<{
    isOpen: boolean;
    invoice: Invoice | null;
  }>({
    isOpen: false,
    invoice: null,
  });

  const tabs = [
    { id: "all" as TabType, label: "All", icon: FileText },
    { id: "draft" as TabType, label: "Draft", icon: Edit2 },
    { id: "sent" as TabType, label: "Sent", icon: Send },
    { id: "overdue" as TabType, label: "Overdue", icon: AlertCircle },
    { id: "paid" as TabType, label: "Paid", icon: CheckCircle },
    { id: "cancelled" as TabType, label: "Cancelled", icon: Trash2 },
    { id: "deleted" as TabType, label: "Deleted", icon: Trash2 },
  ];

  // Helper to safely get project type info
  const getProjectTypeInfo = (invoice: Invoice) => {
    // Check if project_id is populated object
    if (typeof invoice.project_id === "object" && invoice.project_id !== null) {
      // @ts-ignore
      return {
        // @ts-ignore
        projectType: invoice.project_id.project_type,
        // @ts-ignore
        allocationType: invoice.project_id.allocation_type,
      };
    }
    // Fallback to finding in projects list if available
    const project = projects?.find(
      (p) =>
        p.id ===
        (typeof invoice.project_id === "string"
          ? invoice.project_id
          : invoice.project_id.id)
    );
    return {
      projectType: project?.project_type,
      allocationType: project?.allocation_type,
    };
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case "fixed_contract":
        return "Fixed";
      case "monthly_retainer":
        return "Monthly";
      case "hourly_billing":
        return "Hourly";
      default:
        return type || "-";
    }
  };

  const getAllocationTypeLabel = (type: string) => {
    switch (type) {
      case "overall":
        return "Overall";
      case "employee_based":
        return "Emp. Based";
      default:
        return type ? type : "-";
    }
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
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/20 dark:border-slate-700/30">
        <div className="flex flex-col lg:flex-row gap-4 w-full xl:w-auto">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full lg:w-auto overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-semibold text-xs transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-600/50"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={projectTypeFilter}
              onChange={(e) => {
                setProjectTypeFilter(e.target.value);
                if ((window as any).handleInvoiceFilterChange) {
                  (window as any).handleInvoiceFilterChange({
                    project_type: e.target.value,
                  });
                }
              }}
            >
              <option value="">All Types</option>
              <option value="fixed_contract">Fixed Contract</option>
              <option value="monthly_retainer">Monthly Retainer</option>
              <option value="hourly_billing">Hourly Billing</option>
            </select>

            <select
              className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={allocationTypeFilter}
              onChange={(e) => {
                setAllocationTypeFilter(e.target.value);
                if ((window as any).handleInvoiceFilterChange) {
                  (window as any).handleInvoiceFilterChange({
                    allocation_type: e.target.value,
                  });
                }
              }}
            >
              <option value="">All Allocations</option>
              <option value="overall">Overall</option>
              <option value="employee_based">Employee Based</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full xl:w-64">
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
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Allocation</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton Loader
                Array.from({ length: 5 }).map((_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    className="border-b border-white/10 dark:border-slate-600/10 animate-pulse"
                  >
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full inline-block"></div>
                    </td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
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
                invoices.map((invoice) => {
                  // Handle both string project_id and nested project object
                  const project =
                    typeof invoice.project_id === "string"
                      ? projects?.find((p) => p.id === invoice.project_id)
                      : invoice.project_id;

                  const { projectType, allocationType } =
                    getProjectTypeInfo(invoice);

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
                        {projectType ? (
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-medium whitespace-nowrap">
                            {getProjectTypeLabel(projectType)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {allocationType ? (
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-medium whitespace-nowrap">
                            {getAllocationTypeLabel(allocationType)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {formatCurrency(
                          invoice.total_amount ?? invoice.amount,
                          invoice.currency
                        )}
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
                              ref={dropdownRef}
                              className="fixed mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 z-50 right-0"
                              style={{ transform: "translateX(-10px)" }}
                            >
                              {invoice.status === "draft" && (
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
                              )}
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
                                  View Invoice
                                </button>
                              )}
                              {onDuplicateInvoice && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDuplicateInvoice(invoice.id);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                  <Copy className="h-4 w-4" />
                                  Duplicate
                                </button>
                              )}
                              {/* Status change options - only for non-draft invoices */}
                              {invoice.status !== "draft" &&
                                invoice.status !== "paid" &&
                                invoice.status !== "cancelled" &&
                                onUpdateStatus && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateStatus(invoice, "paid");
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-green-600 dark:text-green-400"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Mark as Paid
                                    </button>
                                    {invoice.status !== "overdue" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onUpdateStatus(invoice, "overdue");
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-orange-600 dark:text-orange-400"
                                      >
                                        <AlertCircle className="h-4 w-4" />
                                        Mark as Overdue
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateStatus(invoice, "cancelled");
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Cancel Invoice
                                    </button>
                                  </>
                                )}

                              {invoice.status === "draft" && onEditInvoice && (
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

                              {/* Delete - not available for paid invoices */}
                              {invoice.status !== "paid" && onDeleteInvoice && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteInvoice(invoice.id);
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
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          totalItems={pagination.totalItems}
          itemsPerPage={10} // Assuming 10 for now, or pass from props
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
    </div>
  );
};
