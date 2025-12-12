import React from "react";
import type { Project, Invoice, InvoiceFormData } from "../../types";
import { FormInput, FormSelect, FormTextarea } from "./";
import apiClient from "../../utils/api";
import type { BankAccount } from "../../utils/api";

const InvoiceForm: React.FC<{
  invoice?: Invoice | null;
  projects: Project[];
  defaultProjectId?: string;
  onSave: (data: InvoiceFormData) => void;
  onCancel?: () => void;
}> = ({ invoice, projects, defaultProjectId, onSave }) => {
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);

  // Helper to safely get project ID
  const getProjectId = (projectId: any): string => {
    if (!projectId) return "";
    if (typeof projectId === "string") return projectId;
    return projectId.id || projectId._id || "";
  };

  // Helper to format date safely
  const formatDate = (date: string | undefined): string => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = React.useState<InvoiceFormData>(
    invoice
      ? {
          project_id: getProjectId(invoice.project_id),
          amount: invoice.amount.toString(),
          currency: invoice.currency || "INR",
          status: invoice.status,
          issue_date: formatDate(invoice.issue_date),
          due_date: formatDate(invoice.due_date),
          payment_method: invoice.payment_method || "bank_account",
        }
      : {
          project_id: defaultProjectId || "",
          amount: "",
          currency: "INR",
          status: "draft",
          issue_date: new Date().toISOString().split("T")[0],
          due_date: "",
          payment_method: "bank_account",
        }
  );
  const [services, setServices] = React.useState<
    Array<{
      description: string;
      amount: number;
      team_role?: string;
      hours?: number;
      rate?: number;
    }>
  >(
    invoice?.services && invoice.services.length > 0
      ? invoice.services
      : [{ description: "", amount: 0, team_role: "", hours: 0, rate: 0 }]
  );
  const [includeGst, setIncludeGst] = React.useState(
    invoice?.include_gst !== undefined ? invoice.include_gst : true
  );
  const [gstPercentage, setGstPercentage] = React.useState(
    invoice?.gst_percentage || 18
  );
  const [selectedBankAccount, setSelectedBankAccount] =
    React.useState<string>("");
  const [customPaymentDetails, setCustomPaymentDetails] =
    React.useState<string>(invoice?.custom_payment_details || "");
  const [projectSettings, setProjectSettings] = React.useState<{
    currency: "INR" | "USD";
    gst_percentage: number;
    include_gst: boolean;
    allocation_type?: string;
  } | null>(null);

  // Fetch bank accounts and settings
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [bankResponse, settingsResponse] = await Promise.all([
          apiClient.getBankAccounts(),
          apiClient.getSettings(),
        ]);

        if (bankResponse.success) {
          const accounts = bankResponse.data || [];
          setBankAccounts(accounts);
          // Set selected bank account after fetching
          if (invoice?.bank_account_id) {
            // Handle populated object or string ID
            const bankId =
              typeof invoice.bank_account_id === "object"
                ? (invoice.bank_account_id as any)._id
                : invoice.bank_account_id;
            setSelectedBankAccount(bankId);
          } else if (accounts.length > 0) {
            // Default to first account if none selected
            setSelectedBankAccount(accounts[0]._id);
          }
        }

        if (settingsResponse.success && !invoice) {
          // Only set defaults for new invoices (if no project selected)
          const settings = settingsResponse.data;
          if (settings.gst_settings && !projectSettings) {
            setGstPercentage(settings.gst_settings.default_percentage || 18);
            setIncludeGst(settings.gst_settings.enable_gst !== false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, [invoice, projectSettings]);

  // Auto-fetch Currency & GST from selected project
  React.useEffect(() => {
    const fetchProjectSettings = async () => {
      const projectId =
        typeof formData.project_id === "string"
          ? formData.project_id
          : formData.project_id?.id;

      if (!projectId) return;

      // Find project from props
      const selectedProject = projects.find(
        (p) => p.id === projectId || p._id === projectId
      );

      if (selectedProject) {
        // Apply project's currency and GST settings
        setProjectSettings({
          currency: selectedProject.currency || "INR",
          gst_percentage: selectedProject.gst_percentage ?? 18,
          include_gst: selectedProject.include_gst ?? true,
          allocation_type: selectedProject.allocation_type,
        });

        // Update form data with project's currency
        setFormData((prev) => ({
          ...prev,
          currency: selectedProject.currency || "INR",
        }));

        // Update GST settings from project
        setGstPercentage(selectedProject.gst_percentage ?? 18);
        setIncludeGst(selectedProject.include_gst ?? true);
      }
    };

    if (!invoice) {
      // Only auto-fetch for new invoices
      fetchProjectSettings();
    }
  }, [formData.project_id, projects, invoice]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const subtotal = services.reduce((sum, s) => sum + Number(s.amount), 0);
    const gstAmount = includeGst ? (subtotal * gstPercentage) / 100 : 0;
    const totalAmount = subtotal + gstAmount;

    try {
      await onSave({
        ...formData,
        amount: totalAmount.toString(),
        services,
        subtotal,
        gst_percentage: gstPercentage,
        gst_amount: gstAmount,
        include_gst: includeGst,
        total_amount: totalAmount,
        bank_account_id:
          formData.payment_method === "bank_account"
            ? selectedBankAccount
            : undefined,
        custom_payment_details:
          formData.payment_method === "other"
            ? customPaymentDetails
            : undefined,
      });
    } catch (err: any) {
      setError(apiClient.handleError(err));
    }
  };

  const addService = () => {
    setServices([...services, { description: "", amount: 0 }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (
    index: number,
    field: "description" | "amount" | "team_role" | "hours" | "rate",
    value: string | number
  ) => {
    const updated = [...services];
    // @ts-ignore
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate amount if employee-based
    if (
      projectSettings?.allocation_type === "employee_based" &&
      (field === "hours" || field === "rate")
    ) {
      const hours =
        field === "hours" ? Number(value) : updated[index].hours || 0;
      const rate = field === "rate" ? Number(value) : updated[index].rate || 0;
      updated[index].amount = hours * rate;
    }

    setServices(updated);
  };

  const subtotal = services.reduce((sum, s) => sum + Number(s.amount), 0);
  const gstAmount = includeGst ? (subtotal * gstPercentage) / 100 : 0;
  const totalAmount = subtotal + gstAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Invoice Details Section */}
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <FormSelect
          label="Project"
          name="project_id"
          value={getProjectId(formData.project_id)}
          onChange={handleChange}
          required
          options={[
            { value: "", label: "Select a Project" },
            ...projects.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.client_name || "No Client"})`,
            })),
          ]}
        />

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Services
          </label>
          {services.map((service, index) => (
            <div key={index} className="flex gap-2 flex-wrap sm:flex-nowrap">
              {projectSettings?.allocation_type === "employee_based" ? (
                <>
                  <input
                    type="text"
                    placeholder="Role"
                    value={(service as any).team_role || ""}
                    onChange={(e) =>
                      updateService(index, "team_role", e.target.value)
                    }
                    className="w-32 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={service.description}
                    onChange={(e) =>
                      updateService(index, "description", e.target.value)
                    }
                    className="flex-1 min-w-[150px] px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Hrs"
                    value={(service as any).hours || ""}
                    onChange={(e) =>
                      updateService(
                        index,
                        "hours",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    className="w-20 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Rate"
                    value={(service as any).rate || ""}
                    onChange={(e) =>
                      updateService(
                        index,
                        "rate",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    className="w-24 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                    min="0"
                  />
                  <div className="w-28 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-right">
                    {(service.amount || 0).toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Description"
                    value={service.description}
                    onChange={(e) =>
                      updateService(index, "description", e.target.value)
                    }
                    className="flex-1 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={service.amount || ""}
                    onChange={(e) =>
                      updateService(
                        index,
                        "amount",
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    className="w-32 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                    required
                    min="0"
                  />
                </>
              )}
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addService}
            className="text-blue-600 dark:text-blue-400 text-sm"
          >
            + Add Service
          </button>
        </div>

        {/* Amount Summary */}
        <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              {projectSettings?.currency === "USD" ? "$" : "₹"}
              {subtotal.toFixed(2)}
            </span>
          </div>
          {includeGst && (
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>GST ({gstPercentage}%):</span>
              <span>
                {projectSettings?.currency === "USD" ? "$" : "₹"}
                {gstAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-slate-200 dark:border-slate-600 pt-2">
            <span>
              Total
              {includeGst && (
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                  (GST Included)
                </span>
              )}
            </span>
            <span>
              {projectSettings?.currency === "USD" ? "$" : "₹"}
              {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Issue Date"
            type="date"
            name="issue_date"
            value={formData.issue_date as string}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Due Date"
            type="date"
            name="due_date"
            value={formData.due_date as string}
            onChange={handleChange}
            required
          />
        </div>

        <FormSelect
          label="Payment Method"
          name="payment_method"
          value={formData.payment_method || "bank_account"}
          onChange={handleChange}
          options={[
            { value: "bank_account", label: "Bank Account" },
            { value: "other", label: "Other" },
          ]}
        />

        {/* Bank Account Selection - Always show for default */}
        {(formData.payment_method === "bank_account" ||
          !formData.payment_method) && (
          <FormSelect
            label="Select Bank Account"
            name="bank_account_id"
            value={selectedBankAccount}
            onChange={(e) => setSelectedBankAccount(e.target.value)}
            options={[
              { value: "", label: "Select Bank Account" },
              ...bankAccounts.map((account) => ({
                value: account._id,
                label: `${account.bankName} - ${account.accountNumber.slice(
                  -4
                )} (${account.accountHolderName})`,
              })),
            ]}
          />
        )}

        {/* Custom Payment Details */}
        {formData.payment_method === "other" && (
          <FormTextarea
            label="Payment Details"
            name="custom_payment_details"
            value={customPaymentDetails}
            onChange={(e) => setCustomPaymentDetails(e.target.value)}
            placeholder="Enter payment details (e.g., UPI ID, wallet details, etc.)"
            rows={3}
          />
        )}
      </div>
    </form>
  );
};

export default InvoiceForm;
