import axios from "axios";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import type { Client, PaymentMethod } from "../types";

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  // For auth responses that return token and user at root level
  token?: string;
  user?: User;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
  avatar?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "manager" | "user";
}

// Project types
export interface ProjectClient {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface ProjectTeamMember {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: string;
  hourlyRate?: number;
  assignedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  total_amount: number;
  status: "active" | "on_hold" | "completed" | "cancelled" | "draft";
  start_date: string;
  end_date?: string;
  client_name: string;
  notes?: string;
  user_id: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice types
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  tax?: number;
}

export interface InvoiceClient {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface Invoice {
  currency: "INR" | "USD" | undefined;
  services: { description: string; amount: number }[] | undefined;
  subtotal: number | undefined;
  gst_percentage: number | undefined;
  gst_amount: number | undefined;
  total_amount: number | undefined;
  payment_method: PaymentMethod | undefined;
  bank_account_id: string | undefined;
  custom_payment_details: string | undefined;
  _id: string;
  project_id:
  | string
  | {
    _id: string;
    name: string;
    client_name: string;
    id: string;
  };
  invoice_number: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  createdAt: string;
  updatedAt: string;
}

// Payment types
export interface Payment {
  _id: string;
  invoice_id?: string;
  project_id: string;
  amount: number;
  payment_method: "bank_transfer" | "credit_card" | "upi" | "cash" | "other";
  payment_date: string;
  createdAt: string;
  updatedAt: string;
}

// Bank Account types
export interface BankAccount {
  _id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType?: string;
  swiftCode?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardOverview {
  projects: {
    total: number;
    active: number;
    completed: number;
    statusBreakdown: Array<{
      _id: string;
      count: number;
    }>;
    totalValue: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    statusBreakdown: Array<{
      _id: string;
      count: number;
    }>;
    totalAmount: number;
    paidAmount: number;
    paidGST: number;
  };
  payments: {
    total: number;
    totalAmount: number;
  };
  trends: {
    projects: Array<{
      _id: {
        year: number;
        month: number;
      };
      count: number;
      totalValue: number;
    }>;
    invoices: Array<{
      _id: {
        year: number;
        month: number;
      };
      count: number;
      totalAmount: number;
    }>;
    payments: Array<{
      _id: {
        year: number;
        month: number;
      };
      count: number;
      totalAmount: number;
    }>;
  };
  recentActivities: {
    projects: Array<{
      _id: string;
      name: string;
      status: string;
      createdAt: string;
    }>;
    invoices: Array<{
      _id: string;
      invoice_number: string;
      amount: number;
      status: string;
      project_id: {
        _id: string;
        name: string;
        client_name: string;
      };
      createdAt: string;
    }>;
    payments: Array<{
      _id: string;
      amount: number;
      payment_method: string;
      payment_date: string;
      project_id: {
        _id: string;
        name: string;
        client_name: string;
      };
      invoice_id?: {
        _id: string;
        invoice_number: string;
      };
    }>;
  };
}

// Filtered Dashboard Stats type
export interface DashboardStats {
  availableYears: number[];
  selectedYear: number;
  selectedMonth: number | null;
  stats: {
    projects: {
      total: number;
      active: number;
      completed: number;
      onHold: number;
      totalValue: number;
    };
    invoices: {
      total: number;
      paid: number;
      pending: number;
      overdue: number;
      totalAmount: number;
      paidAmount: number;
    };
    payments: {
      total: number;
      totalAmount: number;
    };
    summary: {
      totalRevenue: number;
      totalGST: number;
      totalPaid: number;
      totalPaidGST: number;
      totalDue: number;
    };
  };
}

// Statistics types
export interface ProjectStats {
  total: number;
  overdue: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalBudget: number;
    totalSpent: number;
  }>;
}

export interface InvoiceStats {
  total: number;
  overdue: number;
  totalRevenue: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalAmount: number;
    paidAmount: number;
  }>;
}

// API Client class
export class ApiClient {
  public axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 300000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }



  private requestCount = 0;
  private minLoadingTime = 500; // Minimum 500ms loader display
  private loadingTimeout: any = null;
  private startTime = 0;

  private startLoading() {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.startTime = Date.now();
      window.dispatchEvent(new Event("api-loading-start"));
    }
  }

  private stopLoading() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0; // Reset to 0 just in case
      const elapsedTime = Date.now() - this.startTime;
      const remainingTime = Math.max(0, this.minLoadingTime - elapsedTime);

      if (this.loadingTimeout) clearTimeout(this.loadingTimeout);

      this.loadingTimeout = setTimeout(() => {
        if (this.requestCount === 0) {
          window.dispatchEvent(new Event("api-loading-end"));
        }
      }, remainingTime);
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Trigger loader start
        this.startLoading();

        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        this.stopLoading();
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.stopLoading();
        return response;
      },
      (error: AxiosError) => {
        this.stopLoading();
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/";
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async register(
    userData: RegisterData
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> =
      await this.axiosInstance.post("/auth/register", userData);
    return response.data;
  }

  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    const response: AxiosResponse<ApiResponse<{ token: string; user: User }>> =
      await this.axiosInstance.post("/auth/login", credentials);
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.axiosInstance.post(
      "/auth/logout"
    );
    return response.data;
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.axiosInstance.post(
      "/auth/forgotpassword",
      { email }
    );
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.axiosInstance.put(
      `/auth/resetpassword/${token}`,
      { password }
    );
    return response.data;
  }

  async updateProfile(userData: any): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> =
      await this.axiosInstance.put("/auth/profile", userData);
    return response.data;
  }

  async getTeamMembers(): Promise<ApiResponse<User[]>> {
    const response: AxiosResponse<ApiResponse<User[]>> =
      await this.axiosInstance.get("/team");
    return response.data;
  }

  async createTeamMember(userData: any): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> =
      await this.axiosInstance.post("/team", userData);
    return response.data;
  }

  async deleteTeamMember(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> =
      await this.axiosInstance.delete(`/team/${id}`);
    return response.data;
  }

  async updateTeamMember(
    id: string,
    userData: any
  ): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> =
      await this.axiosInstance.put(`/team/${id}`, userData);
    return response.data;
  }

  async getSettings(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.axiosInstance.get("/settings");
    return response.data;
  }

  async updateSettings(settingsData: any): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.axiosInstance.put("/settings", settingsData);
    return response.data;
  }

  // Client methods
  async getClients(): Promise<ApiResponse<Client[]>> {
    const response: AxiosResponse<ApiResponse<Client[]>> =
      await this.axiosInstance.get("/clients");
    return response.data;
  }

  async getClient(id: string): Promise<ApiResponse<Client>> {
    const response: AxiosResponse<ApiResponse<Client>> =
      await this.axiosInstance.get(`/clients/${id}`);
    return response.data;
  }

  async createClient(
    clientData: Partial<Client>
  ): Promise<ApiResponse<Client>> {
    const response: AxiosResponse<ApiResponse<Client>> =
      await this.axiosInstance.post("/clients", clientData);
    return response.data;
  }

  async updateClient(
    id: string,
    clientData: Partial<Client>
  ): Promise<ApiResponse<Client>> {
    const response: AxiosResponse<ApiResponse<Client>> =
      await this.axiosInstance.put(`/clients/${id}`, clientData);
    return response.data;
  }

  async deleteClient(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> =
      await this.axiosInstance.delete(`/clients/${id}`);
    return response.data;
  }

  // Dashboard methods
  async getProjectStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.axiosInstance.get("/projects/dashboard/stats");
    return response.data;
  }

  async getInvoiceStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.axiosInstance.get("/invoices/dashboard/stats");
    return response.data;
  }

  async getDashboardOverview(): Promise<ApiResponse<DashboardOverview>> {
    const response: AxiosResponse<ApiResponse<DashboardOverview>> =
      await this.axiosInstance.get("/dashboard/overview");
    return response.data;
  }

  async getProjectDashboard(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.axiosInstance.get("/dashboard/projects");
    return response.data;
  }

  async getInvoiceDashboard(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.axiosInstance.get("/dashboard/invoices");
    return response.data;
  }

  async getPaymentDashboard(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.axiosInstance.get("/dashboard/payments");
    return response.data;
  }

  async getDashboardStats(params?: {
    year?: number;
    month?: number;
    projectId?: string;
    allTime?: boolean;
  }): Promise<ApiResponse<DashboardStats>> {
    const response: AxiosResponse<ApiResponse<DashboardStats>> =
      await this.axiosInstance.get("/dashboard/stats", { params });
    return response.data;
  }

  // Project methods
  async getProjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    manager?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Project[]>> {
    const response: AxiosResponse<ApiResponse<Project[]>> =
      await this.axiosInstance.get("/projects", { params });
    return response.data;
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    const response: AxiosResponse<ApiResponse<Project>> =
      await this.axiosInstance.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(
    projectData: Partial<Project>
  ): Promise<ApiResponse<Project>> {
    const response: AxiosResponse<ApiResponse<Project>> =
      await this.axiosInstance.post("/projects", projectData);
    return response.data;
  }

  async updateProject(
    id: string,
    projectData: Partial<Project>
  ): Promise<ApiResponse<Project>> {
    const response: AxiosResponse<ApiResponse<Project>> =
      await this.axiosInstance.put(`/projects/${id}`, projectData);
    return response.data;
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> =
      await this.axiosInstance.delete(`/projects/${id}`);
    return response.data;
  }

  async updateProjectStatus(
    id: string,
    statusData: { status: string; progress?: number }
  ): Promise<ApiResponse<Project>> {
    const response: AxiosResponse<ApiResponse<Project>> =
      await this.axiosInstance.put(`/projects/${id}/status`, statusData);
    return response.data;
  }

  async addTeamMember(
    id: string,
    memberData: { user: string; role: string; hourlyRate?: number }
  ): Promise<ApiResponse<Project>> {
    const response: AxiosResponse<ApiResponse<Project>> =
      await this.axiosInstance.post(`/projects/${id}/team`, memberData);
    return response.data;
  }

  async removeTeamMember(
    id: string,
    userId: string
  ): Promise<ApiResponse<Project>> {
    const response: AxiosResponse<ApiResponse<Project>> =
      await this.axiosInstance.delete(`/projects/${id}/team/${userId}`);
    return response.data;
  }

  // Invoice methods
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    project?: string;
    issueDateFrom?: string;
    issueDateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    deleted?: boolean;
  }): Promise<ApiResponse<Invoice[]>> {
    const response: AxiosResponse<ApiResponse<Invoice[]>> =
      await this.axiosInstance.get("/invoices", { params });
    return response.data;
  }

  async getInvoice(id: string): Promise<ApiResponse<Invoice>> {
    const response: AxiosResponse<ApiResponse<Invoice>> =
      await this.axiosInstance.get(`/invoices/${id}`);
    return response.data;
  }

  async createInvoice(
    invoiceData: Partial<Invoice>
  ): Promise<ApiResponse<Invoice>> {
    const response: AxiosResponse<ApiResponse<Invoice>> =
      await this.axiosInstance.post("/invoices", invoiceData);
    return response.data;
  }

  async updateInvoice(
    id: string,
    invoiceData: Partial<Invoice>
  ): Promise<ApiResponse<Invoice>> {
    const response: AxiosResponse<ApiResponse<Invoice>> =
      await this.axiosInstance.put(`/invoices/${id}`, invoiceData);
    return response.data;
  }

  async deleteInvoice(id: string, remark?: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> =
      await this.axiosInstance.delete(`/invoices/${id}`, {
        data: { remark },
      });
    return response.data;
  }

  async restoreInvoice(id: string): Promise<ApiResponse<Invoice>> {
    const response: AxiosResponse<ApiResponse<Invoice>> =
      await this.axiosInstance.put(`/invoices/${id}/restore`);
    return response.data;
  }

  async updateInvoiceStatus(
    id: string,
    status: string,
    remark?: string,
    paidDate?: string
  ): Promise<ApiResponse<Invoice>> {
    const response: AxiosResponse<ApiResponse<Invoice>> =
      await this.axiosInstance.put(`/invoices/${id}/status`, {
        status,
        remark,
        paidDate,
      });
    return response.data;
  }

  async duplicateInvoice(id: string): Promise<ApiResponse<Invoice>> {
    const response: AxiosResponse<ApiResponse<Invoice>> =
      await this.axiosInstance.post(`/invoices/${id}/duplicate`);
    return response.data;
  }

  async downloadInvoicePDF(id: string): Promise<Blob> {
    const response = await this.axiosInstance.get(
      `/invoices/${id}/pdf/download`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }

  async viewInvoicePDF(
    id: string
  ): Promise<ApiResponse<{ pdf_base64: string }>> {
    const response: AxiosResponse<ApiResponse<{ pdf_base64: string }>> =
      await this.axiosInstance.get(`/invoices/${id}/pdf/view`);
    return response.data;
  }

  // Payment methods
  async getPayments(params?: {
    page?: number;
    limit?: number;
    project_id?: string;
    invoice_id?: string;
    payment_method?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Payment[]>> {
    const response: AxiosResponse<ApiResponse<Payment[]>> =
      await this.axiosInstance.get("/payments", { params });
    return response.data;
  }

  async getPayment(id: string): Promise<ApiResponse<Payment>> {
    const response: AxiosResponse<ApiResponse<Payment>> =
      await this.axiosInstance.get(`/payments/${id}`);
    return response.data;
  }

  async createPayment(
    paymentData: Partial<Payment>
  ): Promise<ApiResponse<Payment>> {
    const response: AxiosResponse<ApiResponse<Payment>> =
      await this.axiosInstance.post("/payments", paymentData);
    return response.data;
  }

  async updatePayment(
    id: string,
    paymentData: Partial<Payment>
  ): Promise<ApiResponse<Payment>> {
    const response: AxiosResponse<ApiResponse<Payment>> =
      await this.axiosInstance.put(`/payments/${id}`, paymentData);
    return response.data;
  }

  async deletePayment(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> =
      await this.axiosInstance.delete(`/payments/${id}`);
    return response.data;
  }

  async getPaymentStats(): Promise<ApiResponse<any>> {
    const response: AxiosResponse<ApiResponse<any>> =
      await this.axiosInstance.get("/payments/dashboard/stats");
    return response.data;
  }

  // Bank Account methods
  async getBankAccounts(): Promise<ApiResponse<BankAccount[]>> {
    const response: AxiosResponse<ApiResponse<BankAccount[]>> =
      await this.axiosInstance.get("/bank-accounts");
    return response.data;
  }

  async getBankAccount(id: string): Promise<ApiResponse<BankAccount>> {
    const response: AxiosResponse<ApiResponse<BankAccount>> =
      await this.axiosInstance.get(`/bank-accounts/${id}`);
    return response.data;
  }

  async createBankAccount(
    bankData: Partial<BankAccount>
  ): Promise<ApiResponse<BankAccount>> {
    const response: AxiosResponse<ApiResponse<BankAccount>> =
      await this.axiosInstance.post("/bank-accounts", bankData);
    return response.data;
  }

  async updateBankAccount(
    id: string,
    bankData: Partial<BankAccount>
  ): Promise<ApiResponse<BankAccount>> {
    const response: AxiosResponse<ApiResponse<BankAccount>> =
      await this.axiosInstance.put(`/bank-accounts/${id}`, bankData);
    return response.data;
  }

  async deleteBankAccount(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> =
      await this.axiosInstance.delete(`/bank-accounts/${id}`);
    return response.data;
  }

  // Email methods
  async sendInvoiceEmail(
    id: string,
    emailData: {
      to: string;
      cc?: string;
      bcc?: string;
      subject: string;
      body: string;
    }
  ): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.axiosInstance.post(
      `/email/send-invoice/${id}`,
      emailData
    );
    return response.data;
  }

  async testSMTP(smtpSettings: any): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.axiosInstance.post(
      "/email/test-smtp",
      smtpSettings
    );
    return response.data;
  }

  async sendTestEmail(data: {
    templateKey: string;
    to: string;
  }): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.axiosInstance.post(
      "/email/test-email",
      data
    );
    return response.data;
  }

  async getEmailTemplate(
    type: string
  ): Promise<ApiResponse<{ subject: string; body: string }>> {
    const response: AxiosResponse<
      ApiResponse<{ subject: string; body: string }>
    > = await this.axiosInstance.post("/email/template", { type });
    return response.data;
  }

  async regenerateInvoicePDF(
    id: string
  ): Promise<ApiResponse<{ pdf_base64: string }>> {
    const response: AxiosResponse<ApiResponse<{ pdf_base64: string }>> =
      await this.axiosInstance.get(`/invoices/${id}/pdf`);
    return response.data;
  }

  async sendWhatsAppMessage(
    id: string,
    data: { to: string }
  ): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.axiosInstance.post(
      `/whatsapp/send-invoice/${id}`,
      data
    );
    return response.data;
  }

  // Utility method to handle API errors
  handleError(error: AxiosError): string {
    if (
      error.response?.data &&
      typeof error.response.data === "object" &&
      "error" in error.response.data
    ) {
      return (error.response.data as any).error || "An error occurred";
    } else if (
      error.response?.data &&
      typeof error.response.data === "object" &&
      "message" in error.response.data
    ) {
      return (error.response.data as any).message || "An error occurred";
    } else if (error.response?.status === 401) {
      return "Unauthorized. Please login again.";
    } else if (error.response?.status === 403) {
      return "Access denied. You do not have permission to perform this action.";
    } else if (error.response?.status === 404) {
      return "The requested resource was not found.";
    } else if (error.response?.status === 500) {
      return "Server error. Please try again later.";
    } else if (error.code === "NETWORK_ERROR" || !error.response) {
      return "Network error. Please check your connection.";
    }
    return error.message || "An error occurred";
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Types are already exported above

// ========================================
// FRONTEND COMPONENT USAGE GUIDE
// ========================================

// 1. BASIC API IMPORT
// import apiClient from '../utils/api';

// 2. DATA FETCHING WITH REACT HOOKS
// import React, { useEffect, useState } from 'react';
// import apiClient from '../utils/api';
// import type { Project, Invoice, Payment } from '../utils/api';
//
// export const MyComponent: React.FC = () => {
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [invoices, setInvoices] = useState<Invoice[]>([]);
//   const [payments, setPayments] = useState<Payment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//
//         // Fetch projects with optional query parameters
//         const projectsResponse = await apiClient.getProjects({
//           page: 1,
//           limit: 10,
//           status: 'active'
//         });
//
//         // Fetch invoices
//         const invoicesResponse = await apiClient.getInvoices({
//           page: 1,
//           limit: 20
//         });
//
//         // Fetch payments
//         const paymentsResponse = await apiClient.getPayments({
//           page: 1,
//           limit: 15
//         });
//
//         if (projectsResponse.success && projectsResponse.data) {
//           setProjects(projectsResponse.data.projects);
//         }
//
//         if (invoicesResponse.success && invoicesResponse.data) {
//           setInvoices(invoicesResponse.data.invoices);
//         }
//
//         if (paymentsResponse.success && paymentsResponse.data) {
//           setPayments(paymentsResponse.data.payments);
//         }
//       } catch (err: any) {
//         setError(apiClient.handleError(err));
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     fetchData();
//   }, []);
//
//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error}</div>;
//
//   return (
//     <div>
//       {/* Your component JSX */}
//     </div>
//   );
// };

// 3. AUTHENTICATION USAGE
// import React, { useState } from 'react';
// import apiClient from '../utils/api';
// import type { LoginCredentials, RegisterData } from '../utils/api';
//
// export const AuthComponent: React.FC = () => {
//   const [credentials, setCredentials] = useState<LoginCredentials>({
//     email: '',
//     password: ''
//   });
//   const [loading, setLoading] = useState(false);
//
//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//
//     try {
//       const response = await apiClient.login(credentials);
//
//       if (response.success) {
//         // Login successful - token and user data handled by auth context
//         console.log('Login successful', response.user);
//       } else {
//         console.error('Login failed:', response.error);
//       }
//     } catch (error: any) {
//       console.error('Login error:', apiClient.handleError(error));
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const handleRegister = async (userData: RegisterData) => {
//     try {
//       const response = await apiClient.register(userData);
//
//       if (response.success) {
//         console.log('Registration successful', response.user);
//       } else {
//         console.error('Registration failed:', response.error);
//       }
//     } catch (error: any) {
//       console.error('Registration error:', apiClient.handleError(error));
//     }
//   };
// };

// 4. CRUD OPERATIONS
// import React, { useState } from 'react';
// import apiClient from '../utils/api';
// import type { Project, Invoice } from '../utils/api';
//
// export const CrudComponent: React.FC = () => {
//   const [selectedProject, setSelectedProject] = useState<Project | null>(null);
//   const [loading, setLoading] = useState(false);
//
//   // CREATE
//   const createProject = async (projectData: Partial<Project>) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.createProject(projectData);
//
//       if (response.success && response.data) {
//         console.log('Project created:', response.data);
//         return response.data;
//       } else {
//         throw new Error(response.error || 'Failed to create project');
//       }
//     } catch (error: any) {
//       console.error('Create error:', apiClient.handleError(error));
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   // READ
//   const fetchProject = async (id: string) => {
//     try {
//       const response = await apiClient.getProject(id);
//
//       if (response.success && response.data) {
//         setSelectedProject(response.data);
//         return response.data;
//       } else {
//         throw new Error(response.error || 'Failed to fetch project');
//       }
//     } catch (error: any) {
//       console.error('Fetch error:', apiClient.handleError(error));
//       throw error;
//     }
//   };
//
//   // UPDATE
//   const updateProject = async (id: string, projectData: Partial<Project>) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.updateProject(id, projectData);
//
//       if (response.success && response.data) {
//         console.log('Project updated:', response.data);
//         return response.data;
//       } else {
//         throw new Error(response.error || 'Failed to update project');
//       }
//     } catch (error: any) {
//       console.error('Update error:', apiClient.handleError(error));
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   // DELETE
//   const deleteProject = async (id: string) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.deleteProject(id);
//
//       if (response.success) {
//         console.log('Project deleted successfully');
//         return true;
//       } else {
//         throw new Error(response.error || 'Failed to delete project');
//       }
//     } catch (error: any) {
//       console.error('Delete error:', apiClient.handleError(error));
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   // UPDATE STATUS
//   const updateProjectStatus = async (id: string, status: string, progress?: number) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.updateProjectStatus(id, { status, progress });
//
//       if (response.success && response.data) {
//         console.log('Status updated:', response.data);
//         return response.data;
//       } else {
//         throw new Error(response.error || 'Failed to update status');
//       }
//     } catch (error: any) {
//       console.error('Status update error:', apiClient.handleError(error));
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };
// };

// 5. DASHBOARD DATA
// import React, { useEffect, useState } from 'react';
// import apiClient from '../utils/api';
// import type { DashboardOverview } from '../utils/api';
//
// export const DashboardComponent: React.FC = () => {
//   const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
//   const [loading, setLoading] = useState(true);
//
//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         setLoading(true);
//
//         const response = await apiClient.getDashboardOverview();
//
//         if (response.success && response.data) {
//           setDashboardData(response.data);
//         } else {
//           throw new Error(response.error || 'Failed to fetch dashboard data');
//         }
//       } catch (error: any) {
//         console.error('Dashboard fetch error:', apiClient.handleError(error));
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     fetchDashboardData();
//   }, []);
//
//   if (loading) return <div>Loading dashboard...</div>;
//   if (!dashboardData) return <div>Error loading dashboard</div>;
//
//   return (
//     <div>
//       <h2>Projects: {dashboardData.projects.total}</h2>
//       <h2>Invoices: {dashboardData.invoices.total}</h2>
//       <h2>Payments: {dashboardData.payments.total}</h2>
//       {/* More dashboard content */}
//     </div>
//   );
// };

// 6. TEAM MANAGEMENT
// export const TeamManagementComponent: React.FC<{ projectId: string }> = ({ projectId }) => {
//   const [loading, setLoading] = useState(false);
//
//   const addTeamMember = async (memberData: { user: string; role: string; hourlyRate?: number }) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.addTeamMember(projectId, memberData);
//
//       if (response.success && response.data) {
//         console.log('Team member added:', response.data);
//         return response.data;
//       } else {
//         throw new Error(response.error || 'Failed to add team member');
//       }
//     } catch (error: any) {
//       console.error('Add team member error:', apiClient.handleError(error));
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const removeTeamMember = async (userId: string) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.removeTeamMember(projectId, userId);
//
//       if (response.success && response.data) {
//         console.log('Team member removed:', response.data);
//         return response.data;
//       } else {
//         throw new Error(response.error || 'Failed to remove team member');
//       }
//     } catch (error: any) {
//       console.error('Remove team member error:', apiClient.handleError(error));
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };
// };

// 7. INVOICE OPERATIONS
// export const InvoiceManagementComponent: React.FC = () => {
//   const [loading, setLoading] = useState(false);
//
//   const generateInvoicePDF = async (invoiceId: string) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.generateInvoicePDF(invoiceId);
//
//       if (response.success) {
//         // PDF generated successfully
//         console.log('PDF generated for invoice:', invoiceId);
//       } else {
//         throw new Error(response.error || 'Failed to generate PDF');
//       }
//     } catch (error: any) {
//       console.error('PDF generation error:', apiClient.handleError(error));
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const updateInvoiceStatus = async (invoiceId: string, status: string, paidDate?: string) => {
//     try {
//       setLoading(true);
//       const response = await apiClient.updateInvoiceStatus(invoiceId, { status, paidDate });
//
//       if (response.success && response.data) {
//         console.log('Invoice status updated:', response.data);
//         return response.data;
//       } else {
//         throw new Error(response.error || 'Failed to update invoice status');
//       }
//     } catch (error: any) {
//       console.error('Status update error:', apiClient.handleError(error));
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };
// };

// 8. ERROR HANDLING PATTERNS
// const handleApiError = (error: any) => {
//   // Use the built-in error handler
//   const errorMessage = apiClient.handleError(error);
//
//   // Custom error handling based on error type
//   if (error.response?.status === 401) {
//     // Handle unauthorized - redirect to login
//     window.location.href = '/login';
//   } else if (error.response?.status === 403) {
//     // Handle forbidden - show permission error
//     console.error('Access denied');
//   } else if (error.response?.status === 404) {
//     // Handle not found
//     console.error('Resource not found');
//   }
//
//   return errorMessage;
// };

// 9. LOADING STATES
// const LoadingButton: React.FC<{ onClick: () => Promise<void>, children: React.ReactNode }> = ({
//   onClick,
//   children
// }) => {
//   const [loading, setLoading] = useState(false);
//
//   const handleClick = async () => {
//     try {
//       setLoading(true);
//       await onClick();
//     } catch (error) {
//       console.error('Button action error:', apiClient.handleError(error));
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   return (
//     <button onClick={handleClick} disabled={loading}>
//       {loading ? 'Loading...' : children}
//     </button>
//   );
// };

// 10. PAGINATION
// export const PaginatedComponent: React.FC = () => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [data, setData] = useState([]);
//
//   const fetchData = async (page: number) => {
//     try {
//       const response = await apiClient.getProjects({
//         page,
//         limit: 10
//       });
//
//       if (response.success && response.data) {
//         setData(response.data.projects);
//         setTotalPages(response.data.pagination?.totalPages || 1);
//       }
//     } catch (error: any) {
//       console.error('Pagination error:', apiClient.handleError(error));
//     }
//   };
//
//   useEffect(() => {
//     fetchData(currentPage);
//   }, [currentPage]);
//
//   return (
//     <div>
//       <div>Pagination controls...</div>
//       <div>Data list...</div>
//     </div>
//   );
// };
