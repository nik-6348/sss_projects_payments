import React from 'react';
import { GlassCard, PrimaryButton, StatusChip, Modal } from '../components/ui';
import { PaymentForm } from '../components/forms';
import type { Payment, Invoice, PaymentFormData } from '../types';

export const PaymentsListPage: React.FC = () => {
    const [payments, setPayments] = React.useState<Payment[]>([]);
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);

    React.useEffect(() => {
        fetchPayments();
        fetchInvoices();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await fetch('/api/payments', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPayments(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await fetch('/api/invoices', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        }
    };

    const handleCreatePayment = async (data: PaymentFormData) => {
        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                fetchPayments();
                setIsModalOpen(false);
                setSelectedInvoice(null);
            }
        } catch (error) {
            console.error('Failed to create payment:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Payments</h1>
                <PrimaryButton onClick={() => setIsModalOpen(true)}>
                    Record Payment
                </PrimaryButton>
            </div>

            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                                <th className="text-left p-4">Invoice</th>
                                <th className="text-left p-4">Amount</th>
                                <th className="text-left p-4">Method</th>
                                <th className="text-left p-4">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-700">
                                    <td className="p-4">{payment.invoice_id || 'Direct Payment'}</td>
                                    <td className="p-4">{payment.currency === 'USD' ? '$' : '₹'}{payment.amount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <StatusChip status={payment.payment_method} />
                                    </td>
                                    <td className="p-4">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Payment">
                <div className="space-y-4">
                    <select 
                        className="w-full p-2 border rounded"
                        onChange={(e) => {
                            const invoice = invoices.find(inv => inv.id === e.target.value);
                            setSelectedInvoice(invoice || null);
                        }}
                    >
                        <option value="">Select Invoice</option>
                        {invoices.filter(inv => inv.status !== 'paid').map(invoice => (
                            <option key={invoice.id} value={invoice.id}>
                                {invoice.invoice_number} - {invoice.currency === 'USD' ? '$' : '₹'}{invoice.amount}
                            </option>
                        ))}
                    </select>
                    
                    {selectedInvoice && (
                        <PaymentForm
                            invoice={selectedInvoice}
                            onSave={handleCreatePayment}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
};