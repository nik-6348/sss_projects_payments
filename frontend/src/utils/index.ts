import type { Project, Payment, ProjectWithStats } from "../types";

// Formatting utilities
export const formatCurrency = (
  amount: number,
  currency: "INR" | "USD" = "INR"
): string => {
  const symbol = currency === "USD" ? "$" : "₹";
  return `${symbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Status configuration
export const statusConfig = {
  active: {
    text: "Active",
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  completed: {
    text: "Completed",
    classes:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  on_hold: {
    text: "On Hold",
    classes:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  },
  cancelled: {
    text: "Cancelled",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  draft: {
    text: "Draft",
    classes: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  },
  sent: {
    text: "Sent",
    classes: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  paid: {
    text: "Paid",
    classes:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  unpaid: {
    text: "Unpaid",
    classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  overdue: {
    text: "Overdue",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  partial: {
    text: "Partial",
    classes:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
  settled: {
    text: "Settled",
    classes:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
} as const;

// Project calculations
export const calculateProjectStats = (
  project: Project,
  payments: Payment[],
  invoices: any[] = []
): ProjectWithStats => {
  const projectInvoices = invoices.filter(
    (i) => i.project_id?._id === project.id || i.project_id === project.id
  );

  // For each invoice, compute its ex-GST ratio
  const invoiceRatios = new Map<string, number>();
  projectInvoices.forEach((i) => {
    const id = i.id || i._id?.toString();
    const total = Number(i.total_amount || i.amount || 0);
    const sub = Number(i.subtotal || total);
    const ratio = total > 0 ? sub / total : 1;
    if (id) invoiceRatios.set(id, ratio);
  });

  // Calculate paid amounts from payments on an ex-GST basis
  const paidFromPaymentsExGST = payments
    .filter((p) => p.project_id === project.id)
    .reduce((sum, p) => {
      const invId = typeof p.invoice_id === "object" && p.invoice_id ? (p.invoice_id as any)._id : p.invoice_id;
      const ratio = invId ? (invoiceRatios.get(invId.toString()) ?? 1) : 1;
      const credited = Number(p.credited_amount ?? p.amount ?? 0);
      return sum + credited * ratio;
    }, 0);

  // Calculate paid amounts from invoice status on an ex-GST basis
  const paidFromInvoicesExGST = projectInvoices.reduce((sum, i) => {
    const total = Number(i.total_amount || i.amount || 0);
    const sub = Number(i.subtotal || total);
    const ratio = total > 0 ? sub / total : 1;
    const paid = Number(i.paid_amount || 0);
    if (i.status === "paid") return sum + sub;
    return sum + paid * ratio;
  }, 0);

  const paidAmountExGST = Math.max(paidFromPaymentsExGST, paidFromInvoicesExGST);

  // Calculate paid amounts from payments (GST-inclusive)
  const paidFromPayments = payments
    .filter((p) => p.project_id === project.id)
    .reduce((sum, p) => sum + Number(p.credited_amount ?? p.amount ?? 0), 0);

  // Calculate paid amounts from invoice status, including partial payments (GST-inclusive)
  const paidFromInvoices = projectInvoices.reduce((sum, i) => {
    if (i.status === "paid") return sum + Number(i.total_amount ?? i.amount ?? 0);
    return sum + Number(i.paid_amount || 0);
  }, 0);

  const paidAmount = Math.max(paidFromPayments, paidFromInvoices);

  // Calculate effective total based on project type
  let calculatedTotal = project.total_amount || 0;

  if (
    project.project_type === "hourly_billing" &&
    project.hourly_rate &&
    project.estimated_hours
  ) {
    calculatedTotal = project.hourly_rate * project.estimated_hours;
  } else if (
    project.project_type === "monthly_retainer" &&
    project.monthly_fee &&
    project.contract_length
  ) {
    calculatedTotal = project.monthly_fee * project.contract_length;
  }

  const displayTotal = calculatedTotal;

  // Use ex-GST paid amount for dueAmount calculation since total_amount is ex-GST
  const dueAmount = Math.max(displayTotal - paidAmountExGST, 0);
  // Progress based on Ex-GST values
  const progress =
    calculatedTotal > 0 ? (paidAmountExGST / calculatedTotal) * 100 : 0;

  return {
    ...project,
    paidAmount,
    dueAmount,
    progress: Math.round(progress * 100) / 100,
    calculatedTotal: displayTotal,
  };
};

// Generate unique IDs
export const generateId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Debounce utility for React 19
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
};
