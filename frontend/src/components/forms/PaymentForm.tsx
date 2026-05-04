import React from "react";
import type { Payment, Invoice, PaymentFormData } from "../../types";
import { FormInput, FormSelect, FormTextarea } from "./";
import apiClient from "../../utils/api";

interface BankAccount {
  _id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: string;
}

const DEFAULT_TDS_PERCENTAGE = 10;
const DEFAULT_USD_TO_INR_RATE = 83;

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const PaymentForm: React.FC<{
  payment?: Payment | null;
  invoice: Invoice;
  onSave: (data: PaymentFormData) => void;
  onCancel?: () => void;
  id?: string;
}> = ({ payment, invoice, onSave, id = "payment-form" }) => {
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [formData, setFormData] = React.useState<PaymentFormData>(
    payment
      ? {
        project_id: payment.project_id,
        invoice_id: payment.invoice_id || invoice.id,
        amount: payment.amount,
        currency: payment.currency || invoice.currency || "INR",
        payment_method: payment.payment_method,
        payment_date: payment.payment_date,
        remark: payment.remark,
      }
      : {
        project_id:
          typeof invoice.project_id === "string"
            ? invoice.project_id
            : (invoice.project_id as any)._id || invoice.project_id.id,
        invoice_id: invoice.id,
        amount:
          (invoice.total_amount ?? invoice.amount) -
          (invoice.paid_amount || 0),
        currency: invoice.currency || "INR",
        payment_method: invoice.payment_method || "bank_account",
        payment_date: new Date().toISOString().split("T")[0],
        remark: "",
      }
  );
  const [selectedBankAccount, setSelectedBankAccount] =
    React.useState<string>("");
  const [customPaymentDetails, setCustomPaymentDetails] =
    React.useState<string>("");
  const [includeTds, setIncludeTds] = React.useState(
    payment?.include_tds ?? false
  );
  const [tdsPercentage, setTdsPercentage] = React.useState(
    payment?.tds_percentage ?? DEFAULT_TDS_PERCENTAGE
  );
  const [usdToInrRate, setUsdToInrRate] = React.useState(
    payment?.usd_to_inr_rate ?? DEFAULT_USD_TO_INR_RATE
  );

  // Fetch bank accounts and set initial values
  React.useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const [bankResponse, settingsResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/payments/bank-accounts`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          apiClient.getSettings(),
        ]);

        if (bankResponse.ok) {
          const data = await bankResponse.json();
          setBankAccounts(data.data || []);
          // Set initial values from invoice or payment
          if (payment?.bank_account_id) {
            setSelectedBankAccount(payment.bank_account_id);
          } else if (invoice?.bank_account_id) {
            setSelectedBankAccount(invoice.bank_account_id);
          }
          if (payment?.custom_payment_details) {
            setCustomPaymentDetails(payment.custom_payment_details);
          } else if (invoice?.custom_payment_details) {
            setCustomPaymentDetails(invoice.custom_payment_details);
          }
        }

        if (settingsResponse.success && settingsResponse.data) {
          if (!payment?.tds_percentage) {
            setTdsPercentage(
              settingsResponse.data.tds_settings?.default_percentage ??
              DEFAULT_TDS_PERCENTAGE
            );
          }
          if (!payment?.usd_to_inr_rate) {
            setUsdToInrRate(
              settingsResponse.data.currency_settings?.usd_to_inr_rate ??
              DEFAULT_USD_TO_INR_RATE
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch bank accounts:", error);
      }
    };
    fetchBankAccounts();
  }, [payment, invoice]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const invoiceTotal = invoice.total_amount ?? invoice.amount;
  const currentDue = Math.max(invoiceTotal - (invoice.paid_amount || 0), 0);
  const principalRatio =
    invoiceTotal > 0
      ? Math.min(Math.max((invoice.subtotal ?? invoiceTotal) / invoiceTotal, 0), 1)
      : 1;
  const tdsRate = (tdsPercentage / 100) * principalRatio;
  const tdsAmount =
    includeTds && tdsRate > 0 && tdsRate < 1
      ? roundMoney((Number(formData.amount) / (1 - tdsRate)) * tdsRate)
      : 0;
  const creditedAmount = roundMoney(Number(formData.amount) + tdsAmount);
  const remainingAfterPayment = Math.max(0, currentDue - creditedAmount);
  const inrConvertedAmount =
    formData.currency === "USD"
      ? roundMoney(Number(formData.amount) * Number(usdToInrRate || 0))
      : 0;

  const calculateNetAfterTds = (grossAmount: number, percentage: number) => {
    const rate = (percentage / 100) * principalRatio;
    if (rate <= 0 || rate >= 1) return grossAmount;
    return Math.max(0, roundMoney(grossAmount - grossAmount * rate));
  };

  const handleTdsToggle = (checked: boolean) => {
    setIncludeTds(checked);
    setFormData((prev) => ({
      ...prev,
      amount: checked ? calculateNetAfterTds(currentDue, tdsPercentage) : currentDue,
    }));
  };

  const handleTdsPercentageChange = (value: number) => {
    setTdsPercentage(value);
    if (includeTds) {
      setFormData((prev) => ({
        ...prev,
        amount: calculateNetAfterTds(currentDue, value),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentData = {
      ...formData,
      amount: Number(formData.amount),
      include_tds: includeTds,
      tds_percentage: tdsPercentage,
      tds_amount: tdsAmount,
      credited_amount: creditedAmount,
      usd_to_inr_rate: formData.currency === "USD" ? Number(usdToInrRate) : 0,
      inr_converted_amount: inrConvertedAmount,
      bank_account_id:
        formData.payment_method === "bank_account"
          ? selectedBankAccount
          : undefined,
      custom_payment_details:
        formData.payment_method === "other" ? customPaymentDetails : undefined,
    };
    onSave(paymentData);
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Invoice Details Section - Simplified to match InvoiceForm style */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Invoice Number
            </label>
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300">
              {invoice.invoice_number}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Total Amount
            </label>
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-bold">
              {invoice.currency === "USD" ? "$" : "₹"}
              {(invoice.total_amount || invoice.amount).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect
            label="Currency"
            name="currency"
            value={formData.currency as string}
            onChange={handleChange}
            options={[
              { value: "INR", label: "INR (₹)" },
              { value: "USD", label: "USD ($)" },
            ]}
          />
          <FormInput
            label={`Payment Amount (${formData.currency === "USD" ? "$" : "₹"
              })`}
            type="number"
            name="amount"
            value={String(formData.amount)}
            onChange={handleChange}
            required
          />
        </div>

        {formData.currency === "USD" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="USD to INR Rate"
              type="number"
              value={String(usdToInrRate)}
              onChange={(e) => setUsdToInrRate(Number(e.target.value))}
              min="0"
              step="0.01"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                INR Amount
              </label>
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-semibold">
                Rs. {inrConvertedAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={includeTds}
                onChange={(e) => handleTdsToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              TDS Included
            </label>
            {includeTds && (
              <FormInput
                label=""
                type="number"
                value={String(tdsPercentage)}
                onChange={(e) =>
                  handleTdsPercentageChange(
                    e.target.value === ""
                      ? DEFAULT_TDS_PERCENTAGE
                      : Number(e.target.value)
                  )
                }
                min="0"
                max="100"
                step="0.01"
              />
            )}
          </div>
          {includeTds && (
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
              <span>TDS ({tdsPercentage}%):</span>
              <span>
                {invoice.currency === "USD" ? "$" : "â‚¹"}
                {tdsAmount.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Remaining Balance Display */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Current Due:
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {invoice.currency === "USD" ? "$" : "₹"}
              {currentDue.toLocaleString()}
            </span>
          </div>
          {includeTds && (
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
              <span className="text-slate-600 dark:text-slate-400">
                Credited with TDS:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {invoice.currency === "USD" ? "$" : "â‚¹"}
                {creditedAmount.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Remaining after Payment:
            </span>
            <span
              className={`text-lg font-bold ${
                currentDue - creditedAmount < 0
                  ? "text-red-600"
                  : "text-blue-700 dark:text-blue-400"
                }`}
            >
              {invoice.currency === "USD" ? "$" : "₹"}
              {remainingAfterPayment.toLocaleString()}
            </span>
          </div>
        </div>
        <FormInput
          label="Payment Date"
          type="date"
          name="payment_date"
          value={formData.payment_date as string}
          onChange={handleChange}
          required
        />

        <FormSelect
          label="Payment Method"
          name="payment_method"
          value={formData.payment_method as string}
          onChange={handleChange}
          options={[
            { value: "bank_account", label: "Bank Account" },
            { value: "other", label: "Other" },
          ]}
        />

        {/* Bank Account Selection */}
        {formData.payment_method === "bank_account" && (
          <FormSelect
            label="Select Bank Account"
            name="bank_account_id"
            value={selectedBankAccount}
            onChange={(e) => setSelectedBankAccount(e.target.value)}
            required
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
            required
            rows={3}
          />
        )}

        <FormTextarea
          label="Remark (Optional)"
          name="remark"
          value={formData.remark || ""}
          onChange={handleChange}
          placeholder="Add a remark for this payment..."
          rows={2}
        />
      </div>
    </form>
  );
};

export default PaymentForm;
