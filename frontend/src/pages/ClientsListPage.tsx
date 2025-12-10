import React, { useState, useEffect } from "react";
import { Users, Plus, Edit, Trash2 } from "lucide-react";
import { GlassCard, PrimaryButton, Modal } from "../components/ui";
import ClientForm from "../components/forms/ClientForm";
import apiClient from "../utils/api";

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  gst_number?: string;
  pan_number?: string;
}

const ClientsListPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await apiClient.axiosInstance.get("/clients");
      setClients(response.data.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      if (selectedClient) {
        await apiClient.axiosInstance.put(
          `/clients/${selectedClient._id}`,
          data
        );
      } else {
        await apiClient.axiosInstance.post("/clients", data);
      }
      setShowModal(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this client?")) {
      try {
        await apiClient.axiosInstance.delete(`/clients/${id}`);
        fetchClients();
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-slate-600 dark:text-slate-300" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Clients
          </h1>
        </div>
        <PrimaryButton
          onClick={() => {
            setSelectedClient(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-5 w-5" />
          Add Client
        </PrimaryButton>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase border-b border-white/30 dark:border-slate-600/30">
              <tr>
                <th className="px-6 py-3">Client Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">GST Number</th>
                <th className="px-6 py-3">PAN Number</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-12 w-12 text-slate-300 dark:text-slate-500" />
                      <p className="text-lg font-medium">No clients found</p>
                      <p className="text-sm">
                        Add your first client to get started
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client._id}
                    className="border-b border-white/20 dark:border-slate-600/20 hover:bg-white/30 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">
                      {client.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {client.phone}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {client.address?.city || "N/A"},{" "}
                      {client.address?.state || ""}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {client.gst_number || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {client.pan_number || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setShowModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(client._id);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedClient(null);
          }}
          title={`${selectedClient ? "Edit" : "Add"} Client`}
        >
          <ClientForm
            onSubmit={handleSubmit}
            initialData={selectedClient}
            onCancel={() => {
              setShowModal(false);
              setSelectedClient(null);
            }}
            loading={isSaving}
          />
        </Modal>
      )}
    </div>
  );
};

export default ClientsListPage;
