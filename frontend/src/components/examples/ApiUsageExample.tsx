import React, { useEffect, useState } from 'react';
import apiClient from '../../utils/api';
import type { Project, Invoice, Payment } from '../../utils/api';

/**
 * Example component demonstrating various API usage patterns
 */
export const ApiUsageExample: React.FC = () => {
  // State for different data types
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Loading and error states
  const [loading, setLoading] = useState({
    projects: true,
    invoices: true,
    payments: true
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setError(null);

        // Fetch multiple data types concurrently
        const [projectsResponse, invoicesResponse, paymentsResponse] = await Promise.all([
          apiClient.getProjects({ page: 1, limit: 5, status: 'active' }),
          apiClient.getInvoices({ page: 1, limit: 5, status: 'pending' }),
          apiClient.getPayments({ page: 1, limit: 5 })
        ]);

        // Update state based on responses
        if (projectsResponse.success && projectsResponse.data) {
          setProjects(projectsResponse.data);
        }

        if (invoicesResponse.success && invoicesResponse.data) {
          setInvoices(invoicesResponse.data);
        }

        if (paymentsResponse.success && paymentsResponse.data) {
          setPayments(paymentsResponse.data);
        }

        setLoading({ projects: false, invoices: false, payments: false });
      } catch (err: any) {
        setError(apiClient.handleError(err));
        setLoading({ projects: false, invoices: false, payments: false });
      }
    };

    fetchAllData();
  }, []);

  // Handle project creation
  const handleCreateProject = async () => {
    try {
      const newProject = await apiClient.createProject({
        name: 'New Project',
        description: 'Project description',
        client_name: 'Client Name',
        status: 'draft',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: 10000
      });

      if (newProject.success && newProject.data) {
        setProjects(prev => [newProject.data!, ...prev]);
      }
    } catch (error: any) {
      console.error('Failed to create project:', apiClient.handleError(error));
    }
  };

  // Handle invoice status update
  const handleUpdateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const updatedInvoice = await apiClient.updateInvoiceStatus(invoiceId, { status });

      if (updatedInvoice.success && updatedInvoice.data) {
        setInvoices(prev =>
          prev.map(inv => inv._id === invoiceId ? updatedInvoice.data! : inv)
        );
      }
    } catch (error: any) {
      console.error('Failed to update invoice:', apiClient.handleError(error));
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          API Usage Examples
        </h2>
        <button
          onClick={handleCreateProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Project
        </button>
      </div>

      {/* Projects Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Projects</h3>
        {loading.projects ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(project => (
              <div key={project._id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {project.client_name} - {project.status}
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  ${project.total_amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Invoices</h3>
        {loading.invoices ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map(invoice => (
              <div key={invoice._id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Project ID: {invoice.project_id} - {invoice.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-sm text-slate-500">
                    ${invoice.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleUpdateInvoiceStatus(invoice._id, 'paid')}
                    className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded"
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Payments</h3>
        {loading.payments ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map(payment => (
              <div key={payment._id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <p className="font-medium">
                    Project ID: {payment.project_id}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {payment.payment_method} - {new Date(payment.payment_date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  ${payment.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


