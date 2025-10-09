import React from 'react';
import type { Project, Invoice, InvoiceFormData } from '../../types';
import { FormInput, FormSelect } from './';

const InvoiceForm: React.FC<{
    invoice?: Invoice | null;
    projects: Project[];
    defaultProjectId?: string;
    onSave: (data: InvoiceFormData) => void;
    onCancel?: () => void;
}> = ({ invoice, projects, defaultProjectId, onSave }) => {
    const [formData, setFormData] = React.useState<InvoiceFormData>(
        invoice ? {
            project_id: invoice.project_id,
            amount: invoice.amount.toString(),
            status: invoice.status,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date
        } : {
            project_id: defaultProjectId || '',
            amount: '',
            status: 'draft',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: ''
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
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
                    Invoice Details
                </h3>

                <FormSelect
                    label="Project"
                    name="project_id"
                    value={formData.project_id as string}
                    onChange={handleChange}
                    required
                    options={[
                        { value: '', label: 'Select a Project' },
                        ...projects.map(p => ({ value: p.id, label: p.name }))
                    ]}
                />

                <FormInput
                    label="Amount (₹)"
                    type="number"
                    name="amount"
                    value={String(formData.amount)}
                    onChange={handleChange}
                    required
                />

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
            </div>

        </form>
    );
};

export default InvoiceForm;
