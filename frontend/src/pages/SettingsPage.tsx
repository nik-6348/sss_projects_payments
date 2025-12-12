import React from "react";
import {
  Settings,
  Users,
  Building,
  Save,
  Plus,
  Trash2,
  CreditCard,
  Edit2,
  Mail,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "../utils/api";
import { GlassCard, PrimaryButton, ConfirmationModal } from "../components/ui";
import { FormInput, FormSelect, FormTextarea } from "../components/forms";

interface SettingsPageProps {
  // No props needed for now
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [activeTab, setActiveTab] = React.useState<
    "general" | "team" | "bank" | "email" | "deleted_invoices"
  >("general");
  const [loading, setLoading] = React.useState(false);

  // General Settings State
  const [settings, setSettings] = React.useState<any>({
    companyName: "",
    companyAddress: "",
    gstPercentage: 18,
    invoiceFormat: "INV-{YYYY}-{000}",
    currency: "INR",
    company_details: {
      name: "",
      logo: "", // Logo URL
      address: "",
      contact: "",
      email: "",
      gst_number: "",
      LUTNumber: "",
      website: "",
    },
    smtp_settings: {
      host: "",
      port: 587,
      user: "",
      pass: "",
      secure: false,
    },
    email_settings: {
      default_cc: "",
      default_bcc: "",
    },
    email_templates: {
      invoice_default: { subject: "", body: "" },
      payment_receipt: { subject: "", body: "" },
      invoice_overdue: { subject: "", body: "" },
      invoice_cancelled: { subject: "", body: "" },
    },
  });

  const [selectedTemplate, setSelectedTemplate] = React.useState<
    | "invoice_default"
    | "payment_receipt"
    | "invoice_overdue"
    | "invoice_cancelled"
  >("invoice_default");

  const [testEmailTo, setTestEmailTo] = React.useState("");
  const [sendingTestEmail, setSendingTestEmail] = React.useState(false);

  // Team State
  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  const [newMember, setNewMember] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [editingMember, setEditingMember] = React.useState<any>(null);
  const [showAddMemberModal, setShowAddMemberModal] = React.useState(false);
  const [deleteMemberModal, setDeleteMemberModal] = React.useState<{
    isOpen: boolean;
    memberId: string | null;
    memberName: string;
  }>({
    isOpen: false,
    memberId: null,
    memberName: "",
  });

  // Bank Details State
  const [bankAccounts, setBankAccounts] = React.useState<any[]>([]);
  const [showBankModal, setShowBankModal] = React.useState(false);
  const [editingBank, setEditingBank] = React.useState<any>(null);
  const [bankFormData, setBankFormData] = React.useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "current",
    swiftCode: "",
  });
  const [deleteBankModal, setDeleteBankModal] = React.useState<{
    isOpen: boolean;
    accountId: string | null;
    accountName: string;
  }>({
    isOpen: false,
    accountId: null,
    accountName: "",
  });

  // Deleted Invoices State
  const [deletedInvoices, setDeletedInvoices] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchSettings();
    if (activeTab === "team") {
      fetchTeamMembers();
    } else if (activeTab === "bank") {
      fetchBankAccounts();
    } else if (activeTab === "deleted_invoices") {
      fetchDeletedInvoices();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSettings();
      if (response.success && response.data) {
        setSettings({
          ...response.data,
          smtp_settings: response.data.smtp_settings || {
            host: "",
            port: 587,
            user: "",
            pass: "",
            secure: false,
          },
          email_settings: response.data.email_settings || {
            default_cc: "",
            default_bcc: "",
          },
          email_templates: {
            invoice_default: { subject: "", body: "" },
            payment_receipt: { subject: "", body: "" },
            invoice_overdue: { subject: "", body: "" },
            invoice_cancelled: { subject: "", body: "" },
            ...response.data.email_templates,
          },
        });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTeamMembers();
      if (response.success && response.data) {
        setTeamMembers(response.data);
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getBankAccounts();
      if (response.success && response.data) {
        setBankAccounts(response.data);
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedInvoices = async () => {
    try {
      setLoading(true);
      // Use getInvoices with deleted=true param
      const response = await apiClient.getInvoices({ deleted: true });
      if (response.success && response.data) {
        setDeletedInvoices(response.data);
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreInvoice = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiClient.restoreInvoice(id);
      if (response.success) {
        toast.success("Invoice restored successfully");
        fetchDeletedInvoices();
      } else {
        toast.error(response.error || "Failed to restore invoice");
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await apiClient.updateSettings(settings);
      if (response.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(response.error || "Failed to save settings");
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMTP = async () => {
    try {
      setLoading(true);
      const response = await apiClient.testSMTP(settings.smtp_settings);
      if (response.success) {
        toast.success("SMTP Connection Successful!");
      } else {
        toast.error("SMTP Connection Failed");
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const memberData = { ...newMember };
      if (editingMember && !memberData.password) {
        delete (memberData as any).password;
      }

      let response;
      if (editingMember) {
        response = await apiClient.updateTeamMember(
          editingMember._id,
          memberData
        );
      } else {
        response = await apiClient.createTeamMember(memberData);
      }

      if (response.success) {
        toast.success(
          `Team member ${editingMember ? "updated" : "added"} successfully!`
        );
        setShowAddMemberModal(false);
        setNewMember({ name: "", email: "", password: "", role: "employee" });
        setEditingMember(null);
        fetchTeamMembers();
      } else {
        toast.error(
          response.error ||
            `Failed to ${editingMember ? "update" : "add"} team member`
        );
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteMemberModal.memberId) return;
    try {
      setLoading(true);
      const response = await apiClient.deleteTeamMember(
        deleteMemberModal.memberId
      );
      if (response.success) {
        toast.success("Team member removed successfully!");
        setDeleteMemberModal({ isOpen: false, memberId: null, memberName: "" });
        fetchTeamMembers();
      } else {
        toast.error(response.error || "Failed to remove team member");
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      if (editingBank) {
        response = await apiClient.updateBankAccount(
          editingBank._id,
          bankFormData
        );
      } else {
        response = await apiClient.createBankAccount(bankFormData);
      }

      if (response.success) {
        toast.success(
          `Bank account ${editingBank ? "updated" : "added"} successfully!`
        );
        setShowBankModal(false);
        setEditingBank(null);
        setBankFormData({
          accountHolderName: "",
          accountNumber: "",
          ifscCode: "",
          bankName: "",
          accountType: "current",
          swiftCode: "",
        });
        fetchBankAccounts();
      } else {
        toast.error(
          response.error ||
            `Failed to ${editingBank ? "update" : "add"} bank account`
        );
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async () => {
    if (!deleteBankModal.accountId) return;
    try {
      setLoading(true);
      const response = await apiClient.deleteBankAccount(
        deleteBankModal.accountId
      );
      if (response.success) {
        toast.success("Bank account removed successfully!");
        setDeleteBankModal({ isOpen: false, accountId: null, accountName: "" });
        fetchBankAccounts();
      } else {
        toast.error(response.error || "Failed to remove bank account");
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  const openEditBankModal = (bank: any) => {
    setEditingBank(bank);
    setBankFormData({
      accountHolderName: bank.accountHolderName,
      accountNumber: bank.accountNumber,
      ifscCode: bank.ifscCode,
      bankName: bank.bankName,
      accountType: bank.accountType || "current",
      swiftCode: bank.swiftCode || "",
    });
    setShowBankModal(true);
  };

  const openEditMemberModal = (member: any) => {
    setEditingMember(member);
    setNewMember({
      name: member.name,
      email: member.email,
      password: "", // Don't populate password
      role: member.role,
    });
    setShowAddMemberModal(true);
  };

  const handleSendTestEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testEmailTo) {
      toast.error("Please enter a recipient email address");
      return;
    }

    try {
      setSendingTestEmail(true);
      const response = await apiClient.sendTestEmail({
        templateKey: selectedTemplate,
        to: testEmailTo,
      });

      if (response.success) {
        toast.success(`Test email sent to ${testEmailTo}`);
        setTestEmailTo("");
      } else {
        toast.error(response.error || "Failed to send test email");
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setSendingTestEmail(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-slate-600 dark:text-slate-300" />
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          Settings
        </h1>
      </div>

      <GlassCard>
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "general"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("general")}
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              General Settings
            </div>
            {activeTab === "general" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "team"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("team")}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team Management
            </div>
            {activeTab === "team" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "bank"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("bank")}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Bank Details
            </div>
            {activeTab === "bank" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "email"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("email")}
          >
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Configuration
            </div>
            {activeTab === "email" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === "deleted_invoices"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("deleted_invoices")}
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Deleted Invoices
            </div>
            {activeTab === "deleted_invoices" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>

        {activeTab === "general" && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-700">
              Company Details
            </h3>
            <FormInput
              label="Company Name"
              value={settings.company_details?.name || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  company_details: {
                    ...settings.company_details,
                    name: e.target.value,
                  },
                })
              }
              required
            />

            <FormTextarea
              label="Company Address"
              value={settings.company_details?.address || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  company_details: {
                    ...settings.company_details,
                    address: e.target.value,
                  },
                })
              }
              rows={3}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Contact Number"
                value={settings.company_details?.contact || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_details: {
                      ...settings.company_details,
                      contact: e.target.value,
                    },
                  })
                }
              />
              <FormInput
                label="Email Address"
                value={settings.company_details?.email || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_details: {
                      ...settings.company_details,
                      email: e.target.value,
                    },
                  })
                }
              />
              <FormInput
                label="GST Number"
                value={settings.company_details?.gst_number || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_details: {
                      ...settings.company_details,
                      gst_number: e.target.value,
                    },
                  })
                }
              />
              <FormInput
                label="LUT Number"
                value={settings.company_details?.LUTNumber || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_details: {
                      ...settings.company_details,
                      LUTNumber: e.target.value,
                    },
                  })
                }
              />
              {/* <FormInput
                label="Website"
                value={settings.company_details?.website || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    company_details: {
                      ...settings.company_details,
                      website: e.target.value,
                    },
                  })
                }
              /> */}
            </div>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-700 mt-8">
              Invoice Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="GST Percentage (%)"
                type="number"
                value={settings.gst_settings?.default_percentage || 18}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gst_settings: {
                      ...settings.gst_settings,
                      default_percentage: Number(e.target.value),
                    },
                  })
                }
              />
              <FormSelect
                label="Currency"
                value={settings.currency || "INR"}
                onChange={(e) =>
                  setSettings({ ...settings, currency: e.target.value })
                }
                options={[
                  { value: "INR", label: "INR (₹)" },
                  { value: "USD", label: "USD ($)" },
                  { value: "EUR", label: "EUR (€)" },
                ]}
              />
            </div>
            <FormInput
              label="Invoice Format"
              value={settings.invoice_settings?.format || "INV-{YYYY}-{SEQ}"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  invoice_settings: {
                    ...settings.invoice_settings,
                    format: e.target.value,
                  },
                })
              }
              placeholder="e.g. INV-{YYYY}-{SEQ}"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use &#123;YYYY&#125; for year, &#123;MM&#125; for month,
              &#123;SEQ&#125; for sequence number
            </p>
            <div className="pt-4">
              <PrimaryButton type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </PrimaryButton>
            </div>
          </form>
        )}

        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Team Members
              </h3>
              <PrimaryButton
                onClick={() => {
                  setEditingMember(null);
                  setNewMember({
                    name: "",
                    email: "",
                    password: "",
                    role: "employee",
                  });
                  setShowAddMemberModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </PrimaryButton>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 rounded-l-lg">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3 rounded-r-lg text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member) => (
                      <tr
                        key={member._id}
                        className="border-b border-slate-200 dark:border-slate-700"
                      >
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {member.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.role === "admin"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : member.role === "manager"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            }`}
                          >
                            {member.role.charAt(0).toUpperCase() +
                              member.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEditMemberModal(member)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="Edit Member"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteMemberModal({
                                  isOpen: true,
                                  memberId: member._id,
                                  memberName: member.name,
                                })
                              }
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic"
                      >
                        No team members found. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bank" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Bank Accounts
              </h3>
              <PrimaryButton
                onClick={() => {
                  setEditingBank(null);
                  setBankFormData({
                    accountHolderName: "",
                    accountNumber: "",
                    ifscCode: "",
                    bankName: "",
                    accountType: "current",
                    swiftCode: "",
                  });
                  setShowBankModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </PrimaryButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankAccounts.length > 0 ? (
                bankAccounts.map((bank) => (
                  <div
                    key={bank._id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-800 dark:text-white">
                        {bank.bankName}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditBankModal(bank)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteBankModal({
                              isOpen: true,
                              accountId: bank._id,
                              accountName: bank.bankName,
                            })
                          }
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <p>
                        <span className="font-medium">Account Holder:</span>{" "}
                        {bank.accountHolderName}
                      </p>
                      <p>
                        <span className="font-medium">Account No:</span>{" "}
                        {bank.accountNumber}
                      </p>
                      <p>
                        <span className="font-medium">IFSC:</span>{" "}
                        {bank.ifscCode}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span>{" "}
                        {bank.accountType}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400 italic">
                  No bank accounts found. Add one to display on invoices.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "deleted_invoices" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Deleted Invoices
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 rounded-l-lg">Invoice #</th>
                    <th className="px-6 py-3">Project</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Deleted Reason</th>
                    <th className="px-6 py-3 rounded-r-lg text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deletedInvoices.length > 0 ? (
                    deletedInvoices.map((invoice) => (
                      <tr
                        key={invoice._id}
                        className="border-b border-slate-200 dark:border-slate-700"
                      >
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {invoice.project_id?.name || "Unknown Project"}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {invoice.currency} {invoice.amount}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 italic">
                          {invoice.deletion_remark || "No reason provided"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRestoreInvoice(invoice._id)}
                            className="flex items-center gap-1 ml-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Restore Invoice"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic"
                      >
                        No deleted invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "email" && (
          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* SMTP Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-700">
                SMTP Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="SMTP Host"
                  value={settings.smtp_settings.host}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smtp_settings: {
                        ...settings.smtp_settings,
                        host: e.target.value,
                      },
                    })
                  }
                  placeholder="smtp.example.com"
                />
                <FormInput
                  label="SMTP Port"
                  type="number"
                  value={settings.smtp_settings.port}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smtp_settings: {
                        ...settings.smtp_settings,
                        port: Number(e.target.value),
                      },
                    })
                  }
                  placeholder="587"
                />
                <FormInput
                  label="Username"
                  value={settings.smtp_settings.user}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smtp_settings: {
                        ...settings.smtp_settings,
                        user: e.target.value,
                      },
                    })
                  }
                  placeholder="email@example.com"
                />
                <FormInput
                  label="Password"
                  type="password"
                  value={settings.smtp_settings.pass}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      smtp_settings: {
                        ...settings.smtp_settings,
                        pass: e.target.value,
                      },
                    })
                  }
                  placeholder="••••••••"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.smtp_settings.secure}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp_settings: {
                          ...settings.smtp_settings,
                          secure: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Secure Connection (SSL/TLS)
                </label>
                <button
                  type="button"
                  onClick={handleTestSMTP}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Test Connection
                </button>
              </div>
            </div>

            {/* Default Email Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 border-b pb-2 border-slate-200 dark:border-slate-700">
                Default Recipients
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Default CC"
                  value={settings.email_settings.default_cc}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        default_cc: e.target.value,
                      },
                    })
                  }
                  placeholder="cc@example.com, manager@example.com"
                />
                <FormInput
                  label="Default BCC"
                  value={settings.email_settings.default_bcc}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      email_settings: {
                        ...settings.email_settings,
                        default_bcc: e.target.value,
                      },
                    })
                  }
                  placeholder="archive@example.com"
                />
              </div>
            </div>

            {/* Email Template Editor */}
            <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col lg:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                  <FormSelect
                    label="Select Template"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value as any)}
                    options={[
                      {
                        value: "invoice_default",
                        label: "Invoice Sending (Default)",
                      },
                      { value: "payment_receipt", label: "Payment Receipt" },
                      { value: "invoice_overdue", label: "Overdue Reminder" },
                      {
                        value: "invoice_cancelled",
                        label: "Cancellation Notice",
                      },
                    ]}
                  />
                </div>

                <div className="flex-1 w-full pb-1">
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={testEmailTo}
                      onChange={(e) => setTestEmailTo(e.target.value)}
                      placeholder="Recipient email for test..."
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <PrimaryButton
                      onClick={() => handleSendTestEmail()}
                      disabled={sendingTestEmail || !testEmailTo}
                      type="button"
                      className="whitespace-nowrap"
                    >
                      {sendingTestEmail ? "Sending..." : "Send Test"}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <PrimaryButton type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Email Settings
              </PrimaryButton>
            </div>
          </form>
        )}
      </GlassCard>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </h3>
            </div>
            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              <FormInput
                label="Name"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
                required
              />
              <FormInput
                label="Email"
                type="email"
                value={newMember.email}
                onChange={(e) =>
                  setNewMember({ ...newMember, email: e.target.value })
                }
                required
              />
              <FormInput
                label={
                  editingMember
                    ? "New Password (leave blank to keep current)"
                    : "Password"
                }
                type="password"
                value={newMember.password}
                onChange={(e) =>
                  setNewMember({ ...newMember, password: e.target.value })
                }
                required={!editingMember}
              />
              <FormSelect
                label="Role"
                value={newMember.role}
                onChange={(e) =>
                  setNewMember({ ...newMember, role: e.target.value })
                }
                options={[
                  { value: "employee", label: "Employee" },
                  { value: "manager", label: "Manager" },
                ]}
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl transition-colors font-semibold"
                >
                  {loading
                    ? editingMember
                      ? "Updating..."
                      : "Adding..."
                    : editingMember
                    ? "Update Member"
                    : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingBank ? "Edit Bank Account" : "Add Bank Account"}
              </h3>
            </div>
            <form onSubmit={handleSaveBank} className="p-6 space-y-4">
              <FormInput
                label="Account Holder Name"
                value={bankFormData.accountHolderName}
                onChange={(e) =>
                  setBankFormData({
                    ...bankFormData,
                    accountHolderName: e.target.value,
                  })
                }
                required
              />
              <FormInput
                label="Account Number"
                value={bankFormData.accountNumber}
                onChange={(e) =>
                  setBankFormData({
                    ...bankFormData,
                    accountNumber: e.target.value,
                  })
                }
                required
              />
              <FormInput
                label="IFSC Code"
                value={bankFormData.ifscCode}
                onChange={(e) =>
                  setBankFormData({ ...bankFormData, ifscCode: e.target.value })
                }
                required
              />
              <FormInput
                label="Bank Name"
                value={bankFormData.bankName}
                onChange={(e) =>
                  setBankFormData({ ...bankFormData, bankName: e.target.value })
                }
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Account Type"
                  value={bankFormData.accountType}
                  onChange={(e) =>
                    setBankFormData({
                      ...bankFormData,
                      accountType: e.target.value,
                    })
                  }
                  options={[
                    { value: "current", label: "Current" },
                    { value: "savings", label: "Savings" },
                  ]}
                />
                <FormInput
                  label="Swift Code (Optional)"
                  value={bankFormData.swiftCode}
                  onChange={(e) =>
                    setBankFormData({
                      ...bankFormData,
                      swiftCode: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl transition-colors font-semibold"
                >
                  {loading ? "Saving..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteMemberModal.isOpen}
        title="Remove Team Member"
        message={`Are you sure you want to remove "${deleteMemberModal.memberName}"? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleDeleteMember}
        onCancel={() =>
          setDeleteMemberModal({
            isOpen: false,
            memberId: null,
            memberName: "",
          })
        }
        type="danger"
      />

      <ConfirmationModal
        isOpen={deleteBankModal.isOpen}
        title="Remove Bank Account"
        message={`Are you sure you want to remove "${deleteBankModal.accountName}"? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleDeleteBank}
        onCancel={() =>
          setDeleteBankModal({
            isOpen: false,
            accountId: null,
            accountName: "",
          })
        }
        type="danger"
      />
    </div>
  );
};

export default SettingsPage;
