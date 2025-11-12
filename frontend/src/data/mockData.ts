import type { Project, Invoice, Payment } from '../types';

export const initialProjects: Project[] = [
  {
    id: 'proj_1',
    name: 'E-commerce Platform',
    description: 'Full-stack e-commerce solution for a retail client in Mumbai.',
    total_amount: 500000,
    status: 'active',
    start_date: '2024-05-01',
    end_date: '2024-12-31',
    client_id: 'client_1',
    client_name: 'Retail Innovations Pvt. Ltd.',
    notes: 'Phase 2 development is ongoing.',
    created_at: new Date().toISOString(),
    user_id: 'user_123'
  },
  {
    id: 'proj_2',
    name: 'Mobile Banking App',
    description: 'A cross-platform mobile app for a leading bank, targeting the Indian market.',
    total_amount: 800000,
    status: 'completed',
    start_date: '2023-11-10',
    end_date: '2024-06-20',
    client_id: 'client_2',
    client_name: 'Future Bank',
    notes: 'Successfully deployed to app stores.',
    created_at: new Date().toISOString(),
    user_id: 'user_123'
  },
  {
    id: 'proj_3',
    name: 'AI Chatbot Integration',
    description: 'Integrating an AI-powered chatbot into an existing customer support portal.',
    total_amount: 350000,
    status: 'on_hold',
    start_date: '2024-07-15',
    end_date: '2024-10-30',
    client_id: 'client_3',
    client_name: 'Support Solutions Co.',
    notes: 'Project on hold pending new API documentation from the client.',
    created_at: new Date().toISOString(),
    user_id: 'user_123'
  },
  {
    id: 'proj_4',
    name: 'Corporate Website Redesign',
    description: 'Complete overhaul of the corporate branding and website.',
    total_amount: 250000,
    status: 'active',
    start_date: '2024-08-01',
    end_date: '2024-11-15',
    client_id: 'client_4',
    client_name: 'Global Corp',
    notes: '',
    created_at: new Date().toISOString(),
    user_id: 'user_123'
  },
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv_1',
    project_id: 'proj_1',
    invoice_number: 'INV-2024-001',
    amount: 150000,
    status: 'paid',
    issue_date: '2024-05-15',
    due_date: '2024-05-30'
  },
  {
    id: 'inv_2',
    project_id: 'proj_1',
    invoice_number: 'INV-2024-002',
    amount: 100000,
    status: 'sent',
    issue_date: '2024-07-20',
    due_date: '2024-08-05'
  },
  {
    id: 'inv_3',
    project_id: 'proj_2',
    invoice_number: 'INV-2024-003',
    amount: 800000,
    status: 'paid',
    issue_date: '2024-06-25',
    due_date: '2024-07-10'
  },
  {
    id: 'inv_4',
    project_id: 'proj_3',
    invoice_number: 'INV-2024-004',
    amount: 100000,
    status: 'overdue',
    issue_date: '2024-07-30',
    due_date: '2024-08-14'
  },
  {
    id: 'inv_5',
    project_id: 'proj_4',
    invoice_number: 'INV-2024-005',
    amount: 50000,
    status: 'paid',
    issue_date: '2024-08-10',
    due_date: '2024-08-25'
  },
];

export const initialPayments: Payment[] = [
  {
    id: 'pay_1',
    invoice_id: 'inv_1',
    project_id: 'proj_1',
    amount: 150000,
    payment_method: 'bank_account',
    payment_date: '2024-05-28'
  },
  {
    id: 'pay_2',
    invoice_id: 'inv_3',
    project_id: 'proj_2',
    amount: 800000,
    payment_method: 'bank_account',
    payment_date: '2024-07-09'
  },
  {
    id: 'pay_3',
    project_id: 'proj_4',
    amount: 50000,
    payment_method: 'other',
    payment_date: '2024-08-20',
    invoice_id: 'inv_5'
  },
];
