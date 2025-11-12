import React from 'react';
import type { Project, ProjectFormData } from '../../types';
import { FormInput, FormSelect, FormTextarea } from './';
import apiClient from '../../utils/api';

interface Client {
    _id: string;
    name: string;
}

const ProjectForm: React.FC<{
    project?: Project | null;
    onSave: (data: ProjectFormData) => void;
    onCancel?: () => void;
}> = ({ project, onSave }) => {
    const [clients, setClients] = React.useState<Client[]>([]);
    const [formData, setFormData] = React.useState<ProjectFormData>(
        project ? {
            id: project.id,
            name: project.name,
            client_id: project.client_id,
            total_amount: project.total_amount.toString(),
            currency: project.currency || 'INR',
            status: project.status,
            start_date: project.start_date,
            end_date: project.end_date || '',
            description: project.description,
            notes: project.notes || ''
        } : {
            name: '',
            client_id: '',
            total_amount: '',
            currency: 'INR',
            status: 'active',
            start_date: '',
            end_date: '',
            description: '',
            notes: ''
        }
    );

    React.useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await apiClient.getClients();
                if (response.success && response.data) {
                    setClients(response.data);
                }
            } catch (error: any) {
                console.error('Error fetching clients:', apiClient.handleError(error));
            }
        };
        fetchClients();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form Data:', formData);
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
                    Basic Information
                </h3>

                <FormInput
                    label="Project Name"
                    name="name"
                    value={formData.name as string}
                    onChange={handleChange}
                    required
                />
                <FormSelect
                    label="Client"
                    name="client_id"
                    value={formData.client_id as string}
                    onChange={handleChange}
                    options={[
                        { value: '', label: 'Select Client' },
                        ...clients.map(c => ({ value: c._id, label: c.name }))
                    ]}
                    required
                />

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
                        label={`Total Amount (${formData.currency === 'USD' ? '$' : '₹'})`}
                        type="number"
                        name="total_amount"
                        value={formData.total_amount as string}
                        onChange={handleChange}
                        required
                    />
                </div>

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
