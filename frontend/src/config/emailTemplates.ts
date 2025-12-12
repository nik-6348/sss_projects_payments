// Email templates for invoice status notifications
// Matches backend/config/emailTemplates.js

// Template wrapper for consistent design
const wrapEmail = (
  title: string,
  content: string,
  color: string = "#2563eb"
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #334155; line-height: 1.6;">
  <!-- Main Container -->
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Card -->
    <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
      
      <!-- Header -->
      <div style="background-color: ${color}; padding: 32px 40px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">${title}</h1>
      </div>

      <!-- Content -->
      <div style="padding: 40px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
        <p style="margin: 0 0 8px 0;">This is an automated message from <strong>{company_name}</strong></p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} {company_name}. All rights reserved.</p>
      </div>
    </div>

    <!-- Powered By -->
    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0;">Sent via Payment System</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  invoice_default: {
    subject: "Invoice {invoice_number} from {company_name}",
    body: wrapEmail(
      "Invoice Details",
      `
      <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong>{client_name}</strong>,</p>
      <p style="margin-bottom: 24px;">Please find attached the invoice <strong>{invoice_number}</strong> from {company_name}. We appreciate your business.</p>
      
{table_details}

      <p style="margin-bottom: 0;">If you have any questions, please reply to this email.</p>
      <p style="margin-top: 8px;">Regards,<br><strong>{company_name}</strong></p>
      `,
      "#2563eb" // Blue
    ),
  },

  cancelled: {
    subject: "Invoice {invoice_number} Cancelled",
    body: wrapEmail(
      "Invoice Cancelled",
      `
      <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong>{client_name}</strong>,</p>
      <p style="margin-bottom: 24px;">We would like to inform you that invoice <strong>{invoice_number}</strong> has been cancelled.</p>
      
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #ef4444;">
        <p style="margin: 0; color: #b91c1c; font-weight: 500;">Reason: {deletion_remark}</p>
      </div>

{table_details}
      
      <p style="margin-bottom: 0;">If you have any questions, please contact us.</p>
       <p style="margin-top: 8px;">Regards,<br><strong>{company_name}</strong></p>
      `,
      "#ef4444" // Red
    ),
  },

  overdue: {
    subject: "Action Required: Details for Invoice {invoice_number}",
    body: wrapEmail(
      "Payment Reminder",
      `
      <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong>{client_name}</strong>,</p>
      <p style="margin-bottom: 24px;">This is a friendly reminder that invoice <strong>{invoice_number}</strong> is now overdue. We kindly request you to process the payment as soon as possible.</p>
      
{table_details}
      
      <p style="margin-bottom: 0;">If you have already made this payment, please disregard this notice.</p>
      <p style="margin-top: 8px;">Regards,<br><strong>{company_name}</strong></p>
      `,
      "#f97316" // Orange
    ),
  },

  paid: {
    subject: "Payment Received: Invoice {invoice_number}",
    body: wrapEmail(
      "Payment Receipt",
      `
      <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong>{client_name}</strong>,</p>
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #dcfce7; color: #15803d; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px;">PASID IN FULL</span>
      </div>
      <p style="margin-bottom: 24px; text-align: center;">Thank you! We have received your payment for invoice <strong>{invoice_number}</strong>.</p>
      
{table_details}

      <p style="margin-bottom: 0;">We appreciate your prompt payment.</p>
      <p style="margin-top: 8px;">Regards,<br><strong>{company_name}</strong></p>
      `,
      "#10b981" // Green
    ),
  },
};

export default emailTemplates;
