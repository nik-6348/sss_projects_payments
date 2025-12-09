import React from "react";
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Download,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Edit2,
  Send,
  Eye,
} from "lucide-react";
import SendInvoiceModal from "../components/modals/SendInvoiceModal";
import type { Project, Invoice, Payment } from "../types";
import { GlassCard, PrimaryButton, StatusChip } from "../components/ui";
import { formatCurrency, formatDate } from "../utils";
import { useOnClickOutside } from "../hooks/useOnClickOutside";

interface ProjectDetailPageProps {
  project: Project;
  invoices: Invoice[];
  payments: Payment[];
  onEditProject: (project: Project) => void;
  onAddInvoice: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onDownloadInvoice?: (invoice: Invoice) => void;
  onUpdateStatus?: (invoice: Invoice, status: string) => void;
  onViewPDF?: (invoiceId: string) => void;
  onInvoiceSent?: () => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  invoices,
  payments,
  onEditProject,
  onAddInvoice,
  onDeleteProject,
  onEditInvoice,
  onDeleteInvoice,
  onDownloadInvoice,
  onUpdateStatus,
  onViewPDF,
  onInvoiceSent,
}) => {
  const [activeTab, setActiveTab] = React.useState<"details" | "invoices">(
    "details"
  );
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

  const paidAmount = React.useMemo(() => {
    // Calculate from actual payments if available
    const paymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // If no payments but invoices are marked as paid, calculate from paid invoices
    if (paymentAmount === 0) {
      return invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + i.amount, 0);
    }

    return paymentAmount;
  }, [payments, invoices]);

  const dueAmount = project.total_amount - paidAmount;

  const TabButton: React.FC<{
    tabName: "details" | "invoices";
    label: string;
  }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
        activeTab === tabName
          ? "bg-white/60 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100 shadow"
          : "text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-600/30"
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              {project.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {project.client_name}
            </p>
          </div>
        </div>
        <StatusChip status={project.status} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="!p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">
            Total Value
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(project.total_amount, project.currency)}
          </div>
        </GlassCard>
        <GlassCard className="!p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">
            Total Paid
          </div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatCurrency(paidAmount, project.currency)}
          </div>
        </GlassCard>
        <GlassCard className="!p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">
            Total Due
          </div>
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
          {activeTab === "invoices" && (
            <PrimaryButton onClick={() => onAddInvoice(project.id)}>
              <Plus className="h-4 w-4" />
              Add Invoice
            </PrimaryButton>
          )}
        </div>

        <div className="min-h-[200px]">
          {activeTab === "details" && (
            <div className="space-y-4 text-slate-700 dark:text-slate-200">
              <div>
                <strong className="text-slate-800 dark:text-slate-100">
                  Description:
                </strong>{" "}
                {project.description || "N/A"}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-slate-100">
                  Start Date:
                </strong>{" "}
                {formatDate(project.start_date)}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-slate-100">
                  End Date:
                </strong>{" "}
                {formatDate(project.end_date)}
              </div>
              <div>
                <strong className="text-slate-800 dark:text-slate-100">
                  Notes:
                </strong>{" "}
                {project.notes || "N/A"}
              </div>

              {/* Team Members */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Team Members
                </h3>
                {project.team_members && project.team_members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.team_members.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                          {typeof member.user_id === "object"
                            ? member.user_id.name.charAt(0)
                            : "U"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {typeof member.user_id === "object"
                              ? member.user_id.name
                              : "Unknown User"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {member.role} • {member.weekly_hours}h/week
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    No team members assigned.
                  </p>
                )}
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

          {activeTab === "invoices" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase border-b border-white/30 dark:border-slate-600/30">
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap">Invoice #</th>
                    <th className="px-6 py-3 whitespace-nowrap">Amount</th>
                    <th className="px-6 py-3 whitespace-nowrap">Due Date</th>
                    <th className="px-6 py-3 whitespace-nowrap">Status</th>
                    <th className="px-6 py-3 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-white/20 dark:border-slate-600/20"
                    >
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
                              {onDownloadInvoice && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDownloadInvoice(invoice);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                  <Download className="h-4 w-4" />
                                  Download PDF
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
