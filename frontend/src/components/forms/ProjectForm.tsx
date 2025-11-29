import React from "react";
import type { Project, ProjectFormData } from "../../types";
import { FormInput, FormSelect, FormTextarea } from "./";
import apiClient from "../../utils/api";

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
        }
  );

  const [employees, setEmployees] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, teamRes] = await Promise.all([
          apiClient.getClients(),
          apiClient.getTeamMembers(),
        ]);

        if (clientsRes.success && clientsRes.data) {
          setClients(clientsRes.data);
        }
        if (teamRes.success && teamRes.data) {
          setEmployees(teamRes.data);
        }
      } catch (error: any) {
        console.error("Error fetching data:", apiClient.handleError(error));
      }
    };
    fetchData();
  }, []);

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
          <FormInput
            label={`Total Amount (${formData.currency === "USD" ? "$" : "₹"})`}
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
                  ...employees.map((e) => ({ value: e._id, label: e.name })),
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
            <div className="sm:col-span-1">
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
                className="w-full py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                🗑️
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
