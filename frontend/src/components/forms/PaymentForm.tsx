import React from 'react';
import type { Payment, Invoice, PaymentFormData } from '../../types';
import { FormInput, FormSelect } from './';

const PaymentForm: React.FC<{
    payment?: Payment | null;
    invoice: Invoice;
    onSave: (data: PaymentFormData) => void;
    onCancel?: () => void;
}> = ({ payment, invoice, onSave }) => {
    const [formData, setFormData] = React.useState<PaymentFormData>(
        payment ? {
            project_id: payment.project_id,
            invoice_id: payment.invoice_id || invoice.id,
            amount: payment.amount,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date
        } : {
            project_id: invoice.project_id,
            invoice_id: invoice.id,
            amount: invoice.amount,
            payment_method: 'bank_transfer',
            payment_date: new Date().toISOString().split('T')[0]
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Invoice Details Section */}
            <div className="bg-white/20 dark:bg-slate-700/30 p-4 rounded-xl backdrop-blur-md border border-white/20 dark:border-slate-600/50">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-white mb-2">Invoice Details</h3>
                <p className="font-semibold text-slate-800 dark:text-white">{invoice.invoice_number}</p>
                <p className="text-sm text-slate-600 dark:text-white">Amount: ₹{invoice.amount.toLocaleString()}</p>
            </div>

            {/* Payment Details Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
                    Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                        label="Payment Amount (₹)"
                        type="number"
                        name="amount"
                        value={String(formData.amount)}
                        onChange={handleChange}
                        required
                    />
                    <FormInput
                        label="Payment Date"
                        type="date"
                        name="payment_date"
                        value={formData.payment_date as string}
                        onChange={handleChange}
                        required
                    />
                </div>

                <FormSelect
                    label="Payment Method"
                    name="payment_method"
                    value={formData.payment_method as string}
                    onChange={handleChange}
                    options={[
                        { value: 'bank_transfer', label: 'Bank Transfer' },
                        { value: 'other', label: 'Other' }
                    ]}
                />
            </div>

        </form>
    );
};

export default PaymentForm;
