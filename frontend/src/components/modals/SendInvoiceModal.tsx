import React, { useState, useEffect, useRef } from "react";
import { X, Mail, MessageCircle, Send, Paperclip, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { ApiClient } from "../../utils/api";
import { replaceEmailVars } from "../../utils/invoiceUtils";
import { PrimaryButton } from "../ui";
import { FormInput } from "../forms";
import { generateEmailPreview } from "../../utils/emailPreview";

// Helper to handle var replacement wrapper
const processTemplate = (text: string, invoice: any) => {
  return replaceEmailVars(text, invoice);
};
// import { emailTemplates } from "../../config/emailTemplates"; // Removed in favor of backend

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
  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    body: "",
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ccList, setCcList] = useState<string[]>([]);
  const [bccList, setBccList] = useState<string[]>([]);
  const [newCc, setNewCc] = useState("");
  const [newBcc, setNewBcc] = useState("");
  const [attachInvoice, setAttachInvoice] = useState(true);
  const [companyDetails, setCompanyDetails] = useState<any>({});

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const fullHtml = generateEmailPreview(formData.body, companyDetails);

    // Check if content is already initialized
    const contentDiv = doc.querySelector(".content");

    if (!contentDiv) {
      doc.open();
      doc.write(fullHtml);
      doc.close();

      const newContentDiv = doc.querySelector(".content");
      if (newContentDiv) {
        newContentDiv.setAttribute("contenteditable", "true");
        (newContentDiv as HTMLElement).style.outline = "none";

        newContentDiv.addEventListener("input", (e: any) => {
          isInternalUpdate.current = true;
          setFormData((prev) => ({ ...prev, body: e.target.innerHTML }));
        });
      }
    } else {
      // Update content if not triggered by internal edit
      if (!isInternalUpdate.current) {
        const formatted =
          formData.body.trim().startsWith("<") || formData.body.includes("<br")
            ? formData.body
            : formData.body.replace(/\n/g, "<br>");

        if (contentDiv.innerHTML !== formatted) {
          contentDiv.innerHTML = formatted;
        }
      } else {
        isInternalUpdate.current = false;
      }
    }
  }, [formData.body, companyDetails]);

  useEffect(() => {
    if (isOpen && invoice) {
      fetchDefaults();
    }
  }, [isOpen, invoice]);

  const fetchDefaults = async () => {
    try {
      setLoading(true);
      const apiClient = new ApiClient();
      const settingsResponse = await apiClient.getSettings();
      const settings = settingsResponse.data || {};

      let clientEmail = "";
      let clientId = "";

      // Extract Client ID safely
      if (invoice.project_id) {
        if (
          typeof invoice.project_id === "object" &&
          invoice.project_id.client_id
        ) {
          const cid = invoice.project_id.client_id;
          clientId = typeof cid === "object" ? cid._id || cid.id : cid;
        } else if (typeof invoice.project_id === "string") {
          // If project_id is string, we might need to fetch project first,
          // but usually invoice from list has object.
          // Let's try to get it from invoice detail if missing
        }
      }

      // If we don't have a reliable client ID yet, fetch the full invoice to be sure
      if (!clientId) {
        const apiClient = new ApiClient();
        const invoiceDetails = await apiClient.getInvoice(
          invoice.id || invoice._id
        );
        if (invoiceDetails.success && invoiceDetails.data) {
          const proj = invoiceDetails.data.project_id as any;
          if (proj && proj.client_id) {
            clientId =
              typeof proj.client_id === "object"
                ? proj.client_id._id
                : proj.client_id;
          }
        }
      }

      // Now fetch full client details if we have an ID
      if (clientId) {
        try {
          const apiClient = new ApiClient();
          const clientResponse = await apiClient.getClient(clientId);
          if (clientResponse.success && clientResponse.data) {
            const client = clientResponse.data;

            // Email Priority: Finance > Business > Default
            clientEmail =
              client.finance_email ||
              client.business_email ||
              client.email ||
              "";

            // Phone
            if (client.phone) {
              setPhoneNumber(client.phone);
            }
          }
        } catch (err) {
          console.error("Error fetching client details:", err);
        }
      }

      // Fetch template from backend
      let template = {
        subject: "Invoice {invoice_number} from {company_name}",
        body: "Please find attached the invoice {invoice_number}...",
      };

      try {
        const apiClient = new ApiClient();
        const templateResponse = await apiClient.getEmailTemplate(
          "invoice_default"
        );
        if (templateResponse.success && templateResponse.data) {
          template = templateResponse.data;
        }
      } catch (err) {
        console.error("Failed to fetch template from backend, using fallback");
      }

      const emailSettings = settings.email_settings || {
        default_cc: "",
        default_bcc: "",
      };

      setFormData({
        to: clientEmail,
        subject: processTemplate(template.subject, invoice),
        body: processTemplate(template.body, invoice),
      });

      setCompanyDetails(settings.company_details || {});

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

    try {
      setLoading(true);

      if (method === "whatsapp") {
        const response = await apiClient.sendWhatsAppMessage(
          invoice.id || invoice._id,
          { to: phoneNumber }
        );
        if (response.success) {
          toast.success("WhatsApp message sent successfully!");
          if (onSuccess) onSuccess();
          onClose();
        } else {
          toast.error(response.error || "Failed to send WhatsApp message");
        }
        return;
      }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
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
                <span className="text-xs opacity-70">Meta Business API</span>
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
                    Message Preview
                  </label>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[400px] bg-white">
                  <iframe
                    ref={iframeRef}
                    title="Email Preview"
                    className="w-full h-full border-0"
                  />
                </div>
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

          {method === "whatsapp" && (
            <form
              id="send-invoice-whatsapp-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <FormInput
                label="WhatsApp Number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="e.g. 919876543210"
              />
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">Note:</p>
                <p>
                  This will send a templated WhatsApp message to the client with
                  the invoice details and a link to view/download it.
                </p>
                <p className="mt-2 text-xs opacity-80">
                  Ensure the phone number includes the country code without '+'
                  (e.g., 91 for India).
                </p>
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
          {invoice.status === "draft" && (
            <PrimaryButton
              type="submit"
              form={
                method === "email"
                  ? "send-invoice-form"
                  : "send-invoice-whatsapp-form"
              }
              disabled={loading}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default SendInvoiceModal;
