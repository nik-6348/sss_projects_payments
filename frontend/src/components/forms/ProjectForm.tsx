import React from 'react';
import type { Project, ProjectFormData } from '../../types';
import { FormInput, FormSelect, FormTextarea } from './';

const ProjectForm: React.FC<{
    project?: Project | null;
    onSave: (data: ProjectFormData) => void;
    onCancel?: () => void;
}> = ({ project, onSave }) => {
    const [formData, setFormData] = React.useState<ProjectFormData>(
        project ? {
            id: project.id,
            name: project.name,
            client_name: project.client_name,
            total_amount: project.total_amount.toString(),
            status: project.status,
            start_date: project.start_date,
            end_date: project.end_date || '',
            description: project.description,
            notes: project.notes || ''
        } : {
            name: '',
            client_name: '',
            total_amount: '',
            status: 'active',
            start_date: '',
            end_date: '',
            description: '',
            notes: ''
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
                    Basic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                        label="Project Name"
                        name="name"
                        value={formData.name as string}
                        onChange={handleChange}
                        required
                    />
                    <FormInput
                        label="Client Name"
                        name="client_name"
                        value={formData.client_name as string}
                        onChange={handleChange}
                    />
                </div>

                <FormInput
                    label="Total Amount (₹)"
                    type="number"
                    name="total_amount"
                    value={formData.total_amount as string}
                    onChange={handleChange}
                    required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                        label="Start Date"
                        type="date"
                        name="start_date"
                        value={formData.start_date as string}
                        onChange={handleChange}
                        required
                    />
                    <FormInput
                        label="End Date"
                        type="date"
                        name="end_date"
                        value={formData.end_date as string}
                        onChange={handleChange}
                    />
                </div>

                <FormSelect
                    label="Status"
                    name="status"
                    value={formData.status as string}
                    onChange={handleChange}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'on_hold', label: 'On Hold' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' }
                    ]}
                />
            </div>

            {/* Additional Details Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
                    Additional Details
                </h3>

                <FormTextarea
                    label="Description"
                    name="description"
                    value={formData.description as string}
                    onChange={handleChange}
                    rows={3}
                />

                <FormTextarea
                    label="Notes"
                    name="notes"
                    value={formData.notes as string}
                    onChange={handleChange}
                    rows={2}
                />
            </div>

        </form>
    );
};

export default ProjectForm;
