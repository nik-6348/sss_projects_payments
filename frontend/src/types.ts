export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled' | 'draft';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'upi' | 'cash' | 'other';

export interface Project {
  id: string;
  name: string;
  description: string;
  total_amount: number;
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  client_name: string;
  notes?: string;
  created_at: string;
  user_id: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  invoice_number: string;
  amount: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
}

export interface Payment {
  id: string;
  invoice_id?: string;
  project_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
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
export interface ProjectFormData extends Omit<Project, 'created_at' | 'user_id' | 'total_amount'> {
  id?: string; // Optional for new projects
  total_amount: string;
}

export interface InvoiceFormData extends Omit<Invoice, 'id' | 'invoice_number' | 'amount'> {
  amount: string;
}

export interface PaymentFormData extends Omit<Payment, 'id'> {
  amount: number;
}
