import React from 'react';
import type { Payment, Invoice, PaymentFormData } from '../../types';
import { FormInput, FormSelect, FormTextarea } from './';

interface BankAccount {
    _id: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountType: string;
}

const PaymentForm: React.FC<{
    payment?: Payment | null;
    invoice: Invoice;
    onSave: (data: PaymentFormData) => void;
    onCancel?: () => void;
}> = ({ payment, invoice, onSave }) => {
    const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
    const [formData, setFormData] = React.useState<PaymentFormData>(
        payment ? {
            project_id: payment.project_id,
            invoice_id: payment.invoice_id || invoice.id,
            amount: payment.amount,
            currency: payment.currency || invoice.currency || 'INR',
            payment_method: payment.payment_method,
            payment_date: payment.payment_date
        } : {
            project_id: typeof invoice.project_id === 'string' ? invoice.project_id : invoice.project_id.id,
            invoice_id: invoice.id,
            amount: invoice.amount,
            currency: invoice.currency || 'INR',
            payment_method: invoice.payment_method || 'bank_account',
            payment_date: new Date().toISOString().split('T')[0]
        }
    );
    const [selectedBankAccount, setSelectedBankAccount] = React.useState<string>('');
    const [customPaymentDetails, setCustomPaymentDetails] = React.useState<string>('');

    // Fetch bank accounts and set initial values
    React.useEffect(() => {
        const fetchBankAccounts = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/bank-accounts`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
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
            } catch (error) {
                console.error('Failed to fetch bank accounts:', error);
            }
        };
        fetchBankAccounts();
    }, [payment, invoice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const paymentData = {
            ...formData,
            bank_account_id: formData.payment_method === 'bank_account' ? selectedBankAccount : undefined,
            custom_payment_details: formData.payment_method === 'other' ? customPaymentDetails : undefined
        };
        onSave(paymentData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Invoice Details Section */}
            <div className="bg-white/20 dark:bg-slate-700/30 p-4 rounded-xl backdrop-blur-md border border-white/20 dark:border-slate-600/50">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-2">Invoice Details</h3>
                <p className="font-semibold text-slate-800 dark:text-white">{invoice.invoice_number}</p>
                <p className="text-sm text-slate-600 dark:text-white">Amount: {invoice.currency === 'USD' ? '$' : '₹'}{invoice.amount.toLocaleString()}</p>
            </div>

            {/* Payment Details Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
                    Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormSelect
                        label="Currency"
                        name="currency"
                        value={formData.currency as string}
                        onChange={handleChange}
                        options={[
                            { value: 'INR', label: 'INR (₹)' },
                            { value: 'USD', label: 'USD ($)' }
                        ]}
                    />
                    <FormInput
                        label={`Payment Amount (${formData.currency === 'USD' ? '$' : '₹'})`}
                        type="number"
                        name="amount"
                        value={String(formData.amount)}
                        onChange={handleChange}
                        required
                    />
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
                        { value: 'bank_account', label: 'Bank Account' },
                        { value: 'other', label: 'Other' }
                    ]}
                />

                {/* Bank Account Selection */}
                {formData.payment_method === 'bank_account' && (
                    <FormSelect
                        label="Select Bank Account"
                        name="bank_account_id"
                        value={selectedBankAccount}
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                        required
                        options={[
                            { value: '', label: 'Select Bank Account' },
                            ...bankAccounts.map(account => ({
                                value: account._id,
                                label: `${account.bankName} - ${account.accountNumber.slice(-4)} (${account.accountHolderName})`
                            }))
                        ]}
                    />
                )}

                {/* Custom Payment Details */}
                {formData.payment_method === 'other' && (
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
            </div>

        </form>
    );
};

export default PaymentForm;
