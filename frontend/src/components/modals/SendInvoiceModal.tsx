import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  MessageCircle,
  Send,
  Eye,
  EyeOff,
  Paperclip,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import apiClient from "../../utils/api";
import { PrimaryButton } from "../ui";
import { FormInput, FormTextarea } from "../forms";

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onSuccess?: () => void;
}

const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [method, setMethod] = useState<"email" | "whatsapp">("email");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    body: "",
  });
  const [ccList, setCcList] = useState<string[]>([]);
  const [bccList, setBccList] = useState<string[]>([]);
  const [newCc, setNewCc] = useState("");
  const [newBcc, setNewBcc] = useState("");
  const [attachInvoice, setAttachInvoice] = useState(true);

  useEffect(() => {
    if (isOpen && invoice) {
      fetchDefaults();
    }
  }, [isOpen, invoice]);

  const fetchDefaults = async () => {
    try {
      setLoading(true);
      const settingsResponse = await apiClient.getSettings();

      let clientEmail = "";

      // Check if we already have the email in the invoice object (new backend logic)
      const project = invoice.project_id;
      if (
        project &&
        typeof project === "object" &&
        project.client_id &&
        typeof project.client_id === "object" &&
        "email" in project.client_id
      ) {
        clientEmail = (project.client_id as any).email;
      } else {
        // Fallback: Fetch full invoice details to get client email
        const invoiceDetails = await apiClient.getInvoice(
          invoice.id || invoice._id
        );
        if (invoiceDetails.success && invoiceDetails.data) {
          const project = invoiceDetails.data.project_id as any;
          // Check if project is populated object or just ID
          if (project && typeof project === "object" && project.client_id) {
            // If client_id is populated object
            if (
              typeof project.client_id === "object" &&
              project.client_id.email
            ) {
              clientEmail = project.client_id.email;
            } else if (typeof project.client_id === "string") {
              // Fetch client if ID is string
              const clientResponse = await apiClient.getClient(
                project.client_id
              );
              if (clientResponse.success && clientResponse.data) {
                clientEmail = clientResponse.data.email;
              }
            }
          }
        }
      }

      const settings = settingsResponse.data || {};
      const template = settings.email_templates?.invoice_default || {
        subject: "",
        body: "",
      };
      const emailSettings = settings.email_settings || {
        default_cc: "",
        default_bcc: "",
      };

      // Replace variables
      const replaceVars = (text: string) => {
        return text
          .replace(
            /{client_name}/g,
            (invoice.project_id as any)?.client_name || "Client"
          )
          .replace(/{invoice_number}/g, invoice.invoice_number)
          .replace(
            /{company_name}/g,
            settings.company_details?.name || "Company"
          )
          .replace(
            /{amount}/g,
            `${settings.currency || "INR"} ${
              invoice.total_amount || invoice.amount
            }`
          )
          .replace(
            /{due_date}/g,
            new Date(invoice.due_date).toLocaleDateString()
          )
          .replace(
            /{project_name}/g,
            (invoice.project_id as any)?.name || "Project"
          )
          .replace(
            /{currency}/g,
            invoice.currency || settings.currency || "INR"
          );
      };

      setFormData({
        to: clientEmail,
        subject: replaceVars(template.subject),
        body: replaceVars(template.body),
      });

      if (emailSettings.default_cc) {
        setCcList(
          emailSettings.default_cc
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        );
      } else {
        setCcList([]);
      }

      if (emailSettings.default_bcc) {
        setBccList(
          emailSettings.default_bcc
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        );
      } else {
        setBccList([]);
      }
    } catch (error) {
      console.error("Error fetching defaults:", error);
      toast.error("Failed to load email defaults");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCc = () => {
    if (newCc && !ccList.includes(newCc)) {
      setCcList([...ccList, newCc]);
      setNewCc("");
    }
  };

  const handleAddBcc = () => {
    if (newBcc && !bccList.includes(newBcc)) {
      setBccList([...bccList, newBcc]);
      setNewBcc("");
    }
  };

  const removeCc = (email: string) => {
    setCcList(ccList.filter((e) => e !== email));
  };

  const removeBcc = (email: string) => {
    setBccList(bccList.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "whatsapp") {
      toast.info("WhatsApp integration coming soon!");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        cc: ccList.join(", "),
        bcc: bccList.join(", "),
        attachInvoice,
      };

      const response = await apiClient.sendInvoiceEmail(
        invoice.id || invoice._id,
        payload
      );
      if (response.success) {
        toast.success("Invoice sent successfully!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(response.error || "Failed to send invoice");
      }
    } catch (error: any) {
      toast.error(apiClient.handleError(error));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Send Invoice {invoice.invoice_number}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Method Selection */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                method === "email"
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
              }`}
            >
              <Mail className="h-5 w-5" />
              <span className="font-semibold">Email</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("whatsapp")}
              className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                method === "whatsapp"
                  ? "border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                  : "border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700"
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">WhatsApp</span>
                <span className="text-xs opacity-70">Coming Soon</span>
              </div>
            </button>
          </div>

          {method === "email" && (
            <form
              id="send-invoice-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <FormInput
                label="To"
                type="email"
                value={formData.to}
                onChange={(e) =>
                  setFormData({ ...formData, to: e.target.value })
                }
                required
                placeholder="client@example.com"
              />

              {/* CC Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CC
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ccList.map((email, index) => (
                    <span
                      key={index}
                      className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeCc(email)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newCc}
                    onChange={(e) => setNewCc(e.target.value)}
                    placeholder="Add CC recipient"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCc();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCc}
                    className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* BCC Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  BCC
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {bccList.map((email, index) => (
                    <span
                      key={index}
                      className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeBcc(email)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newBcc}
                    onChange={(e) => setNewBcc(e.target.value)}
                    placeholder="Add BCC recipient"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddBcc();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddBcc}
                    className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <FormInput
                label="Subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
              />

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Message Body
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="h-3 w-3" /> Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" /> Show Preview
                      </>
                    )}
                  </button>
                </div>

                {showPreview ? (
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 min-h-[200px] whitespace-pre-wrap text-sm">
                    {formData.body}
                  </div>
                ) : (
                  <FormTextarea
                    name="body"
                    value={formData.body}
                    onChange={(e) =>
                      setFormData({ ...formData, body: e.target.value })
                    }
                    rows={8}
                    required
                  />
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                <input
                  type="checkbox"
                  id="attachInvoice"
                  checked={attachInvoice}
                  onChange={(e) => setAttachInvoice(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="attachInvoice"
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <Paperclip className="h-4 w-4" />
                  <span>Include Invoice PDF attachment</span>
                </label>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold"
          >
            Cancel
          </button>
          <PrimaryButton
            type="submit"
            form="send-invoice-form"
            disabled={loading || method === "whatsapp"}
          >
            {loading ? (
              "Sending..."
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Invoice
              </div>
            )}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default SendInvoiceModal;
