import React from "react";
import type { Project, ProjectFormData } from "../../types";
import { FormInput, FormSelect, FormTextarea } from "./";
import apiClient from "../../utils/api";
import { Trash2 } from "lucide-react";

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
    project
      ? {
          id: project.id,
          name: project.name,
          client_id: project.client_id,
          total_amount: project.total_amount.toString(),
          currency: project.currency || "INR",
          status: project.status,
          start_date: project.start_date,
          end_date: project.end_date || "",
          description: project.description,
          notes: project.notes || "",
          team_members: project.team_members || [],
          // GST Settings
          gst_percentage: project.gst_percentage ?? 18,
          include_gst: project.include_gst ?? true,
          // Client Emails
          client_emails: project.client_emails || {
            business_email: "",
            finance_email: "",
            support_email: "",
          },
          // Project Type
          project_type: project.project_type || "",
          contract_amount: project.contract_amount || 0,
          contract_length: project.contract_length || 0,
          monthly_fee: project.monthly_fee || 0,
          billing_cycle: project.billing_cycle || "",
          hourly_rate: project.hourly_rate || 0,
          estimated_hours: project.estimated_hours || 0,
        }
      : {
          name: "",
          client_id: "",
          total_amount: "",
          currency: "INR",
          status: "active",
          start_date: "",
          end_date: "",
          description: "",
          notes: "",
          // GST Settings
          gst_percentage: 18,
          include_gst: true,
          // Client Emails
          client_emails: {
            business_email: "",
            finance_email: "",
            support_email: "",
          },
          // Project Type
          project_type: "",
          contract_amount: 0,
          contract_length: 0,
          monthly_fee: 0,
          billing_cycle: "",
          hourly_rate: 0,
          estimated_hours: 0,
        }
  );

  const [employees, setEmployees] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, teamRes, settingsRes] = await Promise.all([
          apiClient.getClients(),
          apiClient.getTeamMembers(),
          apiClient.getSettings(),
        ]);

        if (clientsRes.success && clientsRes.data) {
          setClients(clientsRes.data);
        }
        if (teamRes.success && teamRes.data) {
          setEmployees(teamRes.data);
        }
        // Update GST percentage from settings for new projects only
        if (!project && settingsRes.success && settingsRes.data) {
          const gstFromSettings =
            settingsRes.data.gst_settings?.default_percentage ?? 18;
          setFormData((prev) => ({
            ...prev,
            gst_percentage: gstFromSettings,
          }));
        }
      } catch (error: any) {
        console.error("Error fetching data:", apiClient.handleError(error));
      }
    };
    fetchData();
  }, [project]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", formData);
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
            { value: "", label: "Select Client" },
            ...clients.map((c) => ({ value: c._id, label: c.name })),
          ]}
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
        <FormSelect
          label="Status"
          name="status"
          value={formData.status as string}
          onChange={handleChange}
          options={[
            { value: "active", label: "Active" },
            { value: "on_hold", label: "On Hold" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
      </div>

      {/* Team Allocation Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2 flex justify-between items-center">
          <span>Team Allocation</span>
          <button
            type="button"
            onClick={() => {
              const newTeamMembers = [...(formData.team_members || [])];
              newTeamMembers.push({ user_id: "", role: "", weekly_hours: 0 });
              setFormData((prev) => ({
                ...prev,
                team_members: newTeamMembers,
              }));
            }}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            + Add Member
          </button>
        </h3>

        {formData.team_members?.map((member, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg"
          >
            <div className="sm:col-span-5">
              <FormSelect
                label="Team Member"
                name={`member_${index}`}
                value={
                  typeof member.user_id === "object"
                    ? member.user_id._id
                    : member.user_id
                }
                onChange={(e) => {
                  const newTeamMembers = [...(formData.team_members || [])];
                  newTeamMembers[index].user_id = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    team_members: newTeamMembers,
                  }));
                }}
                options={[
                  { value: "", label: "Select Member" },
                  ...employees
                    .filter((emp) => {
                      // Get current member's user_id for this row
                      const currentUserId =
                        typeof member.user_id === "object"
                          ? member.user_id._id
                          : member.user_id;
                      // Allow if this is the currently selected member for this row
                      if (emp._id === currentUserId) return true;
                      // Filter out members already selected in other rows
                      const alreadySelected = formData.team_members?.some(
                        (tm, idx) => {
                          if (idx === index) return false; // Skip current row
                          const selectedId =
                            typeof tm.user_id === "object"
                              ? tm.user_id._id
                              : tm.user_id;
                          return selectedId === emp._id;
                        }
                      );
                      return !alreadySelected;
                    })
                    .map((e) => ({ value: e._id, label: e.name })),
                ]}
              />
            </div>
            <div className="sm:col-span-4">
              <FormInput
                label="Role"
                name={`role_${index}`}
                value={member.role}
                onChange={(e) => {
                  const newTeamMembers = [...(formData.team_members || [])];
                  newTeamMembers[index].role = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    team_members: newTeamMembers,
                  }));
                }}
                placeholder="e.g. Developer"
              />
            </div>
            <div className="sm:col-span-2">
              <FormInput
                label="Hours/Week"
                type="number"
                name={`hours_${index}`}
                value={member.weekly_hours.toString()}
                onChange={(e) => {
                  const newTeamMembers = [...(formData.team_members || [])];
                  newTeamMembers[index].weekly_hours = Number(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    team_members: newTeamMembers,
                  }));
                }}
              />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => {
                  const newTeamMembers = [...(formData.team_members || [])];
                  newTeamMembers.splice(index, 1);
                  setFormData((prev) => ({
                    ...prev,
                    team_members: newTeamMembers,
                  }));
                }}
                className="w-full p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Remove team member"
              >
                <Trash2 className="h-5 w-5 mx-auto" />
              </button>
            </div>
          </div>
        ))}
        {(!formData.team_members || formData.team_members.length === 0) && (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No team members assigned yet.
          </p>
        )}
      </div>

      {/* GST Settings Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
          GST Settings
        </h3>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="include_gst"
              checked={formData.include_gst as boolean}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  include_gst: e.target.checked,
                }))
              }
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              htmlFor="include_gst"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Include GST in Invoices
              {formData.include_gst && (
                <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">
                  @ {formData.gst_percentage}%
                </span>
              )}
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            GST rate ({formData.gst_percentage}%) is from system settings
          </p>
        </div>
      </div>

      {/* Project Type Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2">
          Project Type <span className="text-red-500">*</span>
        </h3>
        <FormSelect
          label="Select Project Type"
          name="project_type"
          value={(formData.project_type as string) || ""}
          onChange={handleChange}
          required
          options={[
            { value: "", label: "Select Type" },
            { value: "fixed_contract", label: "Fixed Contract" },
            { value: "monthly_retainer", label: "Monthly Retainer" },
            { value: "hourly_billing", label: "Hourly Billing" },
          ]}
        />

        {/* Fixed Contract Fields */}
        {formData.project_type === "fixed_contract" && (
          <div className="p-4 rounded-lg">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Fixed Contract Amount ({formData.currency === "USD" ? "$" : "₹"})
            </label>
            <FormInput
              label=""
              type="number"
              name="total_amount"
              value={formData.total_amount as string}
              onChange={handleChange}
              required
              placeholder="Enter fixed contract amount"
            />
          </div>
        )}

        {/* Monthly Retainer Fields */}
        {formData.project_type === "monthly_retainer" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <FormInput
              label={`Monthly Fee (${formData.currency === "USD" ? "$" : "₹"})`}
              type="number"
              name="monthly_fee"
              value={(formData.monthly_fee as number)?.toString() || "0"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  monthly_fee: Number(e.target.value),
                }))
              }
            />
            <FormInput
              label="Estimated Months"
              type="number"
              name="contract_length"
              value={(formData.contract_length as number)?.toString() || "0"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contract_length: Number(e.target.value),
                }))
              }
              placeholder="How many months?"
            />
          </div>
        )}

        {/* Hourly Billing Fields */}
        {formData.project_type === "hourly_billing" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <FormInput
              label={`Hourly Rate (${formData.currency === "USD" ? "$" : "₹"})`}
              type="number"
              name="hourly_rate"
              value={(formData.hourly_rate as number)?.toString() || "0"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  hourly_rate: Number(e.target.value),
                }))
              }
            />
            <FormInput
              label="Estimated Hours"
              type="number"
              name="estimated_hours"
              value={(formData.estimated_hours as number)?.toString() || "0"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  estimated_hours: Number(e.target.value),
                }))
              }
            />
          </div>
        )}
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
