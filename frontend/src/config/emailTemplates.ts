// Email templates for invoice status notifications
// Matches backend/config/emailTemplates.js

export const emailTemplates = {
  invoice_default: {
    subject: "Invoice {invoice_number} from {company_name}",
    body: `
      <p>Dear {client_name},</p>
      <p>Please find attached the invoice {invoice_number} from {company_name}.</p>
      
      <div class="details">
        <div class="details-row">
          <span><strong>Invoice Number:</strong></span>
          <span>{invoice_number}</span>
        </div>
        <div class="details-row">
          <span><strong>Amount:</strong></span>
          <span>{amount}</span>
        </div>
        <div class="details-row">
          <span><strong>Due Date:</strong></span>
          <span>{due_date}</span>
        </div>
      </div>

      <p>We appreciate your business.</p>
      <p>Regards,<br><strong>{company_name}</strong></p>
    `,
  },

  cancelled: {
    subject: "Invoice {invoice_number} Has Been Cancelled",
    body: `
      <p>Dear {client_name},</p>
      <p>We would like to inform you that your invoice has been <span class="status-badge" style="display: inline-block; background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.9em;">Cancelled</span>.</p>
      
      <p><strong>Reason for Cancellation:</strong> {deletion_remark}</p>

      <div class="details">
        <div class="details-row">
          <span><strong>Invoice Number:</strong></span>
          <span>{invoice_number}</span>
        </div>
        <div class="details-row">
          <span><strong>Project:</strong></span>
          <span>{project_name}</span>
        </div>
        <div class="details-row">
          <span><strong>Amount:</strong></span>
          <span>{amount}</span>
        </div>
      </div>
      
      <p>If you have any questions regarding this cancellation, please don't hesitate to contact us.</p>
      <p>Best regards,<br><strong>{company_name}</strong></p>
    `,
  },

  overdue: {
    subject: "Reminder: Invoice {invoice_number} is Overdue",
    body: `
      <p>Dear {client_name},</p>
      
      <div class="urgent" style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <strong>⚠️ Important:</strong> Your invoice is now <span class="status-badge" style="display: inline-block; background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.9em;">Overdue</span>
      </div>
      
      <p>This is a friendly reminder that payment for the following invoice is past due. Please arrange payment at your earliest convenience to avoid any service interruptions.</p>
      
      <div class="details">
        <div class="details-row">
          <span><strong>Invoice Number:</strong></span>
          <span>{invoice_number}</span>
        </div>
        <div class="details-row">
          <span><strong>Project:</strong></span>
          <span>{project_name}</span>
        </div>
        <div class="details-row">
          <span><strong>Amount Due:</strong></span>
          <span style="color: #dc2626; font-weight: bold;">{amount}</span>
        </div>
        <div class="details-row">
          <span><strong>Due Date:</strong></span>
          <span style="color: #dc2626;">{due_date}</span>
        </div>
      </div>
      
      <p>If you have already made this payment, please disregard this notice.</p>
      <p>Best regards,<br><strong>{company_name}</strong></p>
    `,
  },

  paid: {
    subject: "Payment Received - Invoice {invoice_number}",
    body: `
      <p>Dear {client_name},</p>
      
      <div class="success" style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <strong>🎉 Thank you!</strong> We have received your payment for invoice <span class="status-badge" style="display: inline-block; background: #d1fae5; color: #059669; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.9em;">PAID</span>
      </div>
      
      <p>This email confirms that your payment has been successfully processed.</p>
      
      <div class="details">
        <div class="details-row">
          <span><strong>Invoice Number:</strong></span>
          <span>{invoice_number}</span>
        </div>
        <div class="details-row">
          <span><strong>Project:</strong></span>
          <span>{project_name}</span>
        </div>
        <div class="details-row">
          <span><strong>Amount Paid:</strong></span>
          <span style="color: #059669; font-weight: bold;">{amount}</span>
        </div>
        <div class="details-row">
          <span><strong>Payment Date:</strong></span>
          <span>{paid_date}</span>
        </div>
      </div>
      
      <p>We appreciate your prompt payment and continued business.</p>
      <p>Best regards,<br><strong>{company_name}</strong></p>
    `,
  },
};

export default emailTemplates;
