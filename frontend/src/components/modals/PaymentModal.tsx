import React from "react";
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
  const handleSavePayment = async (data: PaymentFormData) => {
    try {
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
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <PrimaryButton type="submit" form="payment-form">
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
    </Modal>
  );
};

export default PaymentModal;
