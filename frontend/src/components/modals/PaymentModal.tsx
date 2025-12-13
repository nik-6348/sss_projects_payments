import React, { useState } from "react";
import { Modal, PrimaryButton } from "../ui";
import PaymentForm from "../forms/PaymentForm";
import type { Invoice, PaymentFormData } from "../../types";
import { toast } from "react-toastify";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePayment = async (data: PaymentFormData) => {
    try {
      setIsSaving(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Payment recorded successfully");
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("An error occurred while recording payment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <PrimaryButton type="submit" form="payment-form" loading={isSaving}>
            Save Payment
          </PrimaryButton>
        </>
      }
    >
      <PaymentForm
        id="payment-form"
        invoice={invoice}
        onSave={handleSavePayment}
        onCancel={onClose}
      />

      {/* Email Preview Section */}
      <div className="mt-4 border-t pt-4">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-700 dark:text-slate-200">
            <span>Preview Email Notification</span>
            <span className="transition group-open:rotate-180">
              <svg
                fill="none"
                height="24"
                shapeRendering="geometricPrecision"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="24"
              >
                <path d="M6 9l6 6 6-6"></path>
              </svg>
            </span>
          </summary>
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            <EmailPreview invoice={invoice} status="paid" />
          </div>
        </details>
      </div>
    </Modal>
  );
};

// Simple internal component/helper for preview (avoids unnecessary re-fetching if we moved state up, but keeping it simple here)
import { ApiClient } from "../../utils/api";
import { replaceEmailVars } from "../../utils/invoiceUtils";

const EmailPreview = ({
  invoice,
  status,
}: {
  invoice: Invoice;
  status: string;
}) => {
  const [content, setContent] = useState<string>("Loading template...");

  React.useEffect(() => {
    const fetchTpl = async () => {
      try {
        const apiClient = new ApiClient();
        const res = await apiClient.getEmailTemplate(status);
        if (res.success && res.data) {
          const body = replaceEmailVars(res.data.body, invoice);
          setContent(body);
        } else {
          setContent("Failed to load email template.");
        }
      } catch (e) {
        setContent("Error loading template.");
      }
    };
    fetchTpl();
  }, [status, invoice]);

  return (
    <div
      className="p-4 bg-gray-50 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 max-h-60 overflow-y-auto"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default PaymentModal;
