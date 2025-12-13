import type { Invoice } from "../types";

export const getCurrencySymbol = (currency: string | undefined): string => {
  return currency === "USD" ? "$" : "₹";
};

export const generateInvoiceTableHtml = (invoice: Invoice): string => {
  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  const currencyCode = invoice.currency || settings.currency || "INR";
  const currencySymbol = getCurrencySymbol(currencyCode);

  const { project_type, allocation_type } = (invoice.project_id as any) || {};

  const isEmployeeBased =
    (project_type === "hourly_billing" ||
      project_type === "monthly_retainer" ||
      project_type === "fixed_contract") &&
    allocation_type === "employee_based";

  // Checking specifically for Monthly Retainer structure to show "Monthly Fee" column label if desired
  const isMonthly =
    project_type === "monthly_retainer" || project_type === "fixed_contract";

  const thStyle =
    "background-color: #f8fafc; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; white-space: nowrap;";
  const tdStyle =
    "padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155;";
  const tdNumStyle =
    "padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; text-align: right; white-space: nowrap;";
  const trFooterStyle = "background-color: #f8fafc;";

  let headers = "";
  if (isEmployeeBased) {
    headers = `
      <tr>
        <th style="${thStyle} width: 40%">Role / Description</th>
        ${
          !isMonthly
            ? `<th style="${thStyle} width: 15%; text-align: center">Hours</th>`
            : ""
        }
        <th style="${thStyle} width: 20%; text-align: right">${
      isMonthly ? "Monthly Fee" : "Rate"
    }</th>
        <th style="${thStyle} width: 25%; text-align: right">Amount</th>
      </tr>`;
  } else {
    headers = `
      <tr>
        <th style="${thStyle} width: 70%">Description</th>
        <th style="${thStyle} width: 30%; text-align: right">Amount</th>
      </tr>`;
  }

  const rows = (invoice.services || [])
    .map((service: any) => {
      const amountFormatted = `${currencySymbol} ${Number(
        service.amount
      ).toFixed(2)}`;
      if (isEmployeeBased) {
        const roleDesc = service.team_role
          ? `${service.team_role} - ${service.description}`
          : service.description;
        const rateFormatted = service.rate
          ? `${currencySymbol} ${Number(service.rate).toFixed(2)}`
          : "-";
        const hours = service.hours || 0;

        return `
        <tr>
          <td style="${tdStyle}">${roleDesc}</td>
          ${
            !isMonthly
              ? `<td style="${tdStyle} text-align: center">${hours}</td>`
              : ""
          }
          <td style="${tdNumStyle}">${rateFormatted}</td>
          <td style="${tdNumStyle} font-weight: 600;">${amountFormatted}</td>
        </tr>`;
      } else {
        const desc = service.description || "Service";
        return `
        <tr>
          <td style="${tdStyle}">${desc}</td>
          <td style="${tdNumStyle} font-weight: 600;">${amountFormatted}</td>
        </tr>`;
      }
    })
    .join("");

  // Footer Rows
  const colspanLabel = isEmployeeBased ? (isMonthly ? 2 : 3) : 1;
  let footerRows = "";

  // Subtotal
  footerRows += `
    <tr>
      <td colspan="${colspanLabel}" style="${tdStyle} text-align: right; font-weight: 600; color: #64748b;">Sub Total</td>
      <td style="${tdNumStyle} font-weight: 600;">${currencySymbol} ${Number(
    invoice.subtotal
  ).toFixed(2)}</td>
    </tr>
  `;

  // Tax
  if ((invoice.gst_amount || 0) > 0) {
    footerRows += `
    <tr>
      <td colspan="${colspanLabel}" style="${tdStyle} text-align: right; font-weight: 600; color: #64748b;">GST (${
      invoice.gst_percentage || 0
    }%)</td>
      <td style="${tdNumStyle} font-weight: 600;">${currencySymbol} ${Number(
      invoice.gst_amount || 0
    ).toFixed(2)}</td>
    </tr>
  `;
  }

  // Total
  footerRows += `
    <tr style="${trFooterStyle}">
      <td colspan="${colspanLabel}" style="${tdStyle} text-align: right; font-weight: 700; color: #334155; font-size: 16px;">Total Payable</td>
      <td style="${tdNumStyle} font-weight: 700; color: #2563eb; font-size: 16px;">${currencySymbol} ${Number(
    invoice.total_amount || 0
  ).toFixed(2)}</td>
    </tr>
  `;

  // Wrapping in a responsive div
  return `
    <div style="margin-bottom: 32px; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse; min-width: 500px;">
        <thead>${headers}</thead>
        <tbody>${rows}${footerRows}</tbody>
      </table>
    </div>
  `;
};

export const replaceEmailVars = (text: string, invoice: Invoice): string => {
  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  const currencyCode = invoice.currency || settings.currency || "INR";
  const currencySymbol = getCurrencySymbol(currencyCode);

  const getCancellationRemark = () => {
    if ((invoice as any).deletion_remark)
      return (invoice as any).deletion_remark;
    if ((invoice as any).remark && invoice.status === "cancelled")
      return (invoice as any).remark;
    if (Array.isArray((invoice as any).status_history)) {
      const cancelledEntry = [...(invoice as any).status_history]
        .reverse()
        .find((h: any) => h.status === "cancelled");
      return cancelledEntry?.remark || "";
    }
    return "";
  };

  return text
    .replace(
      /{client_name}/g,
      (invoice.project_id as any)?.client_name || "Client"
    )
    .replace(/{invoice_number}/g, invoice.invoice_number)
    .replace(/{company_name}/g, settings?.company_details?.name || "Company")
    .replace(/{project_name}/g, (invoice.project_id as any)?.name || "Project")
    .replace(/{due_date}/g, new Date(invoice.due_date).toLocaleDateString())
    .replace(/{currency}/g, currencySymbol)
    .replace(/{deletion_remark}/g, getCancellationRemark())
    .replace(/{table_details}/g, generateInvoiceTableHtml(invoice));
};
