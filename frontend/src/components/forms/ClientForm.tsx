import React, { useState } from "react";
import { FormInput, FormTextarea, FormSelect } from "./index";
import { Country, State } from "country-state-city";
import { PrimaryButton } from "../ui";

interface ClientFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel?: () => void;
  loading?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({
  onSubmit,
  initialData,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: {
      street: initialData?.address?.street || "",
      city: initialData?.address?.city || "",
      state: initialData?.address?.state || "",
      pincode: initialData?.address?.pincode || "",
      country: initialData?.address?.country || "India",
    },
    gst_number: initialData?.gst_number || "",
    pan_number: initialData?.pan_number || "",
    // Additional email contacts
    business_email: initialData?.business_email || "",
    finance_email: initialData?.finance_email || "",
    support_email: initialData?.support_email || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const countries = Country.getAllCountries().map((country) => ({
    value: country.name,
    label: country.name,
    isoCode: country.isoCode,
  }));

  const selectedCountryCode =
    countries.find((c) => c.value === formData.address.country)?.isoCode ||
    "IN";

  const states = State.getStatesOfCountry(selectedCountryCode).map((state) => ({
    value: state.name,
    label: state.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        label="Client Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <FormInput
        label="Primary Email"
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

      {/* Additional Email Contacts */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Additional Email Contacts
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <FormInput
            label="Business Email"
            type="email"
            value={formData.business_email}
            onChange={(e) =>
              setFormData({ ...formData, business_email: e.target.value })
            }
            placeholder="business@company.com"
          />
          <FormInput
            label="Finance Email"
            type="email"
            value={formData.finance_email}
            onChange={(e) =>
              setFormData({ ...formData, finance_email: e.target.value })
            }
            placeholder="finance@company.com"
          />
          <FormInput
            label="Support Email"
            type="email"
            value={formData.support_email}
            onChange={(e) =>
              setFormData({ ...formData, support_email: e.target.value })
            }
            placeholder="support@company.com"
          />
        </div>
      </div>

      <FormTextarea
        label="Street Address"
        value={formData.address.street}
        onChange={(e) =>
          setFormData({
            ...formData,
            address: { ...formData.address, street: e.target.value },
          })
        }
      />
      <div className="grid grid-cols-2 gap-4">
        <FormSelect
          label="Country"
          value={formData.address.country}
          options={countries}
          onChange={(e) => {
            const newCountry = e.target.value;
            // Reset state when country changes
            setFormData({
              ...formData,
              address: { ...formData.address, country: newCountry, state: "" },
            });
          }}
        />
        <FormSelect
          label="State"
          value={formData.address.state}
          options={states}
          onChange={(e) =>
            setFormData({
              ...formData,
              address: { ...formData.address, state: e.target.value },
            })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="City"
          value={formData.address.city}
          onChange={(e) =>
            setFormData({
              ...formData,
              address: { ...formData.address, city: e.target.value },
            })
          }
        />
        <FormInput
          label="Pincode"
          value={formData.address.pincode}
          onChange={(e) =>
            setFormData({
              ...formData,
              address: { ...formData.address, pincode: e.target.value },
            })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="GST Number"
          value={formData.gst_number}
          onChange={(e) =>
            setFormData({
              ...formData,
              gst_number: e.target.value.toUpperCase(),
            })
          }
        />
        <FormInput
          label="PAN Number"
          value={formData.pan_number}
          onChange={(e) =>
            setFormData({
              ...formData,
              pan_number: e.target.value.toUpperCase(),
            })
          }
        />
      </div>
      <div className="flex gap-4">
        <PrimaryButton type="submit" loading={loading}>
          Save Client
        </PrimaryButton>
        {onCancel && (
          <PrimaryButton type="button" onClick={onCancel}>
            Cancel
          </PrimaryButton>
        )}
      </div>
    </form>
  );
};

export default ClientForm;
