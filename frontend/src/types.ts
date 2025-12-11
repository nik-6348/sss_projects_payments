export type ProjectStatus =
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "draft";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type ProjectType =
  | "fixed_contract"
  | "monthly_retainer"
  | "hourly_billing"
  | "";
export type BillingCycle = "monthly" | "quarterly" | "yearly" | "";
export type AllocationType = "overall" | "employee_based" | "";

export interface ProjectClientEmails {
  business_email?: string;
  finance_email?: string;
  support_email?: string;
}
export type PaymentMethod =
  | "bank_account"
  | "other"
  | "bank_transfer"
  | "credit_card";

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
  // Additional email contacts
  business_email?: string;
  finance_email?: string;
  support_email?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  user_id:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string;
      };
  role: string;
  monthly_hours: number;
  rate?: number;
}

export interface Project {
  _id?: string;
  id: string;
  name: string;
  description: string;
  total_amount: number;
  currency?: "INR" | "USD";
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
  team_members?: TeamMember[];
  // GST Settings
  gst_percentage?: number;
  include_gst?: boolean;
  // Multi-Email Support
  client_emails?: ProjectClientEmails;
  // Project Type
  project_type?: ProjectType;
  contract_amount?: number;
  contract_length?: number;
  monthly_fee?: number;
  billing_cycle?: BillingCycle;
  hourly_rate?: number;
  estimated_hours?: number;
  allocation_type?: AllocationType;
}

// API response type for projects
export interface ProjectApiResponse {
  _id: string;
  name: string;
  description: string;
  total_amount: number;
  currency?: "INR" | "USD";
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  client_id: string | { _id: string; name: string };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  user_id: string;
  // GST Settings
  gst_percentage?: number;
  include_gst?: boolean;
  // Multi-Email Support
  client_emails?: ProjectClientEmails;
  // Project Type
  project_type?: ProjectType;
  contract_amount?: number;
  contract_length?: number;
  monthly_fee?: number;
  billing_cycle?: BillingCycle;
  hourly_rate?: number;
  estimated_hours?: number;
  allocation_type?: AllocationType;
}

export interface Invoice {
  _id?: string;
  id: string;
  project_id:
    | string
    | {
        _id: string;
        name: string;
        client_name: string;
        client_id?: string | { _id: string; name: string; email: string };
        id: string;
      };
  invoice_number: string;
  amount: number;
  currency?: "INR" | "USD";
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
  include_gst?: boolean;
  total_amount?: number;
  paid_amount?: number;
  balance_due?: number;
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
  currency?: "INR" | "USD";
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
  include_gst?: boolean;
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
  currency?: "INR" | "USD";
  payment_method: PaymentMethod;
  bank_account_id?: string;
  custom_payment_details?: string;
  remark?: string;
  payment_date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectWithStats extends Project {
  paidAmount: number;
  dueAmount: number;
  progress: number;
  calculatedTotal: number;
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
export interface ProjectFormData
  extends Omit<
    Project,
    "created_at" | "user_id" | "total_amount" | "id" | "client_name"
  > {
  id?: string;
  total_amount: string;
  team_members?: TeamMember[];
}

export interface InvoiceFormData
  extends Omit<Invoice, "id" | "invoice_number" | "amount"> {
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
  include_gst?: boolean;
  total_amount?: number;
}

export interface PaymentFormData extends Omit<Payment, "id"> {
  amount: number;
  bank_account_id?: string;
  custom_payment_details?: string;
  remark?: string;
}
