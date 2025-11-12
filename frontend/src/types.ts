export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled' | 'draft';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_account' | 'other' | 'bank_transfer' | 'credit_card';

export interface Client {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  _id?: string;
  id: string;
  name: string;
  description: string;
  total_amount: number;
  currency?: 'INR' | 'USD';
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  client_id: string;
  client_name: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  user_id: string;
}

// API response type for projects
export interface ProjectApiResponse {
  _id: string;
  name: string;
  description: string;
  total_amount: number;
  currency?: 'INR' | 'USD';
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  client_id: string | { _id: string; name: string };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  user_id: string;
}

export interface Invoice {
  _id?: string;
  id: string;
  project_id: string | {
    _id: string;
    name: string;
    client_name: string;
    id: string;
  };
  invoice_number: string;
  amount: number;
  currency?: 'INR' | 'USD';
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  payment_method?: PaymentMethod;
  bank_account_id?: string;
  custom_payment_details?: string;
  services?: Array<{
    description: string;
    amount: number;
  }>;
  subtotal?: number;
  gst_percentage?: number;
  gst_amount?: number;
  total_amount?: number;
  pdf_base64?: string;
  pdf_generated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API response type for invoices
export interface InvoiceApiResponse {
  _id: string;
  project_id: string;
  invoice_number: string;
  amount: number;
  currency?: 'INR' | 'USD';
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  payment_method?: PaymentMethod;
  bank_account_id?: string;
  custom_payment_details?: string;
  services?: Array<{
    description: string;
    amount: number;
  }>;
  subtotal?: number;
  gst_percentage?: number;
  gst_amount?: number;
  total_amount?: number;
  pdf_base64?: string;
  pdf_generated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id?: string;
  id: string;
  invoice_id?: string;
  project_id: string;
  amount: number;
  currency?: 'INR' | 'USD';
  payment_method: PaymentMethod;
  bank_account_id?: string;
  custom_payment_details?: string;
  payment_date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectWithStats extends Project {
  paidAmount: number;
  dueAmount: number;
  progress: number;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalRevenue: number;
  totalPaid: number;
  totalDue: number;
  overdueInvoices: number;
}

export interface FormData {
  [key: string]: string | number;
}

// Form data interfaces for better type safety
export interface ProjectFormData extends Omit<Project, 'created_at' | 'user_id' | 'total_amount' | 'id' | 'client_name'> {
  id?: string;
  total_amount: string;
}

export interface InvoiceFormData extends Omit<Invoice, 'id' | 'invoice_number' | 'amount'> {
  amount: string;
  payment_method?: PaymentMethod;
  bank_account_id?: string;
  custom_payment_details?: string;
  services?: Array<{
    description: string;
    amount: number;
  }>;
  subtotal?: number;
  gst_percentage?: number;
  gst_amount?: number;
  total_amount?: number;
}

export interface PaymentFormData extends Omit<Payment, 'id'> {
  amount: number;
  bank_account_id?: string;
  custom_payment_details?: string;
}
