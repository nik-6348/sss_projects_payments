import React from 'react';
import type { Project, Invoice, InvoiceFormData } from '../../types';
import { FormInput, FormSelect, FormTextarea } from './';

interface BankAccount {
    _id: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountType: string;
}

const InvoiceForm: React.FC<{
    invoice?: Invoice | null;
    projects: Project[];
    defaultProjectId?: string;
    onSave: (data: InvoiceFormData) => void;
    onCancel?: () => void;
}> = ({ invoice, projects, defaultProjectId, onSave }) => {
    const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
    const [formData, setFormData] = React.useState<InvoiceFormData>(
        invoice ? {
            project_id: typeof invoice.project_id === 'string' 
                ? invoice.project_id 
                : invoice.project_id.id,
            amount: invoice.amount.toString(),
            currency: invoice.currency || 'INR',
            status: invoice.status,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            payment_method: invoice.payment_method || 'bank_account'
        } : {
            project_id: defaultProjectId || '',
            amount: '',
            currency: 'INR',
            status: 'draft',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: '',
            payment_method: 'bank_account'
        }
    );
    const [services, setServices] = React.useState<Array<{ description: string; amount: number }>>(
        invoice?.services && invoice.services.length > 0 
            ? invoice.services 
            : [{ description: '', amount: 0 }]
    );
    const [gstPercentage, setGstPercentage] = React.useState(invoice?.gst_percentage || 18);
    const [selectedBankAccount, setSelectedBankAccount] = React.useState<string>('');
    const [customPaymentDetails, setCustomPaymentDetails] = React.useState<string>(invoice?.custom_payment_details || '');

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
                    // Set selected bank account after fetching
                    if (invoice?.bank_account_id) {
                        setSelectedBankAccount(invoice.bank_account_id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch bank accounts:', error);
            }
        };
        fetchBankAccounts();
    }, [invoice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subtotal = services.reduce((sum, s) => sum + Number(s.amount), 0);
        const gstAmount = (subtotal * gstPercentage) / 100;
        const totalAmount = subtotal + gstAmount;
        onSave({ 
            ...formData, 
            amount: totalAmount.toString(),
            services,
            subtotal,
            gst_percentage: gstPercentage,
            gst_amount: gstAmount,
            total_amount: totalAmount,
            bank_account_id: formData.payment_method === 'bank_account' ? selectedBankAccount : undefined,
            custom_payment_details: formData.payment_method === 'other' ? customPaymentDetails : undefined
        });
    };

    const addService = () => {
        setServices([...services, { description: '', amount: 0 }]);
    };

    const removeService = (index: number) => {
        setServices(services.filter((_, i) => i !== index));
    };

    const updateService = (index: number, field: 'description' | 'amount', value: string | number) => {
        const updated = [...services];
        updated[index] = { ...updated[index], [field]: value };
        setServices(updated);
    };

    const subtotal = services.reduce((sum, s) => sum + Number(s.amount), 0);
    const gstAmount = (subtotal * gstPercentage) / 100;
    const totalAmount = subtotal + gstAmount;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Invoice Details Section */}
            <div className="space-y-4">
                <FormSelect
                    label="Project"
                    name="project_id"
                    value={typeof formData.project_id === 'string' ? formData.project_id : formData.project_id.id}
                    onChange={handleChange}
                    required
                    options={[
                        { value: '', label: 'Select a Project' },
                        ...projects.map(p => ({ 
                            value: p.id, 
                            label: `${p.name} (${p.client_name})` 
                        }))
                    ]}
                />

                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Services</label>
                    {services.map((service, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Description"
                                value={service.description}
                                onChange={(e) => updateService(index, 'description', e.target.value)}
                                className="flex-1 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Amount"
                                value={service.amount || ''}
                                onChange={(e) => updateService(index, 'amount', e.target.value === '' ? 0 : Number(e.target.value))}
                                className="w-32 px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                                required
                                min="0"
                            />
                            {services.length > 1 && (
                                <button type="button" onClick={() => removeService(index)} className="px-3 py-2 bg-red-500 text-white rounded-lg">×</button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addService} className="text-blue-600 dark:text-blue-400 text-sm">+ Add Service</button>
                </div>

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
                        label="GST %"
                        type="number"
                        name="gst_percentage"
                        value={gstPercentage}
                        onChange={(e) => setGstPercentage(Number(e.target.value))}
                    />
                </div>

                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{formData.currency === 'USD' ? '$' : '₹'}{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>GST ({gstPercentage}%):</span><span>{formData.currency === 'USD' ? '$' : '₹'}{gstAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formData.currency === 'USD' ? '$' : '₹'}{totalAmount.toFixed(2)}</span></div>
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
                    label="Status"
                    name="status"
                    value={formData.status as string}
                    onChange={handleChange}
                    options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'sent', label: 'Sent' },
                        { value: 'paid', label: 'Paid' },
                        { value: 'overdue', label: 'Overdue' },
                        { value: 'cancelled', label: 'Cancelled' }
                    ]}
                />

                <FormSelect
                    label="Payment Method"
                    name="payment_method"
                    value={formData.payment_method || 'bank_account'}
                    onChange={handleChange}
                    options={[
                        { value: 'bank_account', label: 'Bank Account' },
                        { value: 'other', label: 'Other' }
                    ]}
                />

                {/* Bank Account Selection - Always show for default */}
                {(formData.payment_method === 'bank_account' || !formData.payment_method) && (
                    <FormSelect
                        label="Select Bank Account"
                        name="bank_account_id"
                        value={selectedBankAccount}
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
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
                        rows={3}
                    />
                )}
            </div>
        </form>
    );
};

export default InvoiceForm;
