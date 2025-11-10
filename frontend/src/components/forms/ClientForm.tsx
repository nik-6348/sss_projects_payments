import React, { useState } from 'react';
import { FormInput, FormTextarea } from './index';
import { PrimaryButton } from '../ui';

interface ClientFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel?: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: {
      street: initialData?.address?.street || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
      pincode: initialData?.address?.pincode || '',
      country: initialData?.address?.country || 'India'
    },
    gst_number: initialData?.gst_number || '',
    pan_number: initialData?.pan_number || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        label="Client Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <FormInput
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <FormInput
        label="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />
      <FormTextarea
        label="Street Address"
        value={formData.address.street}
        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="City"
          value={formData.address.city}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
        />
        <FormInput
          label="State"
          value={formData.address.state}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Pincode"
          value={formData.address.pincode}
          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
        />
        <FormInput
          label="GST Number"
          value={formData.gst_number}
          onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
        />
      </div>
      <div className="flex gap-4">
        <PrimaryButton type="submit">Save Client</PrimaryButton>
        {onCancel && <PrimaryButton type="button" onClick={onCancel}>Cancel</PrimaryButton>}
      </div>
    </form>
  );
};

export default ClientForm;
