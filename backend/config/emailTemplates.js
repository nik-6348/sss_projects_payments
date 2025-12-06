// Email templates for invoice status notifications

export const emailTemplates = {
  cancelled: {
    subject: "Invoice {invoice_number} Has Been Cancelled",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .status-badge { display: inline-block; background: #fee2e2; color: #dc2626; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .details-row:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">{company_name}</h1>
      <p style="margin: 10px 0 0;">Invoice Notification</p>
    </div>
    <div class="content">
      <p>Dear {client_name},</p>
      <p>We would like to inform you that your invoice has been <span class="status-badge">Cancelled</span>.</p>
      
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
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  overdue: {
    subject: "Reminder: Invoice {invoice_number} is Overdue",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .status-badge { display: inline-block; background: #fef3c7; color: #d97706; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
    .urgent { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .details-row:last-child { border-bottom: none; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">{company_name}</h1>
      <p style="margin: 10px 0 0;">Payment Reminder</p>
    </div>
    <div class="content">
      <p>Dear {client_name},</p>
      
      <div class="urgent">
        <strong>⚠️ Important:</strong> Your invoice is now <span class="status-badge">Overdue</span>
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
      
      <p>If you have already made this payment, please disregard this notice. Otherwise, kindly remit payment as soon as possible.</p>
      <p>If you are experiencing any difficulties or have questions, please contact us immediately so we can work together to find a solution.</p>
      <p>Best regards,<br><strong>{company_name}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
    `,
  },

  paid: {
    subject: "Payment Received - Invoice {invoice_number}",
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
    .status-badge { display: inline-block; background: #d1fae5; color: #059669; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
    .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .details-row:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✓ Payment Confirmed</h1>
      <p style="margin: 10px 0 0;">{company_name}</p>
    </div>
    <div class="content">
      <p>Dear {client_name},</p>
      
      <div class="success">
        <strong>🎉 Thank you!</strong> We have received your payment for invoice <span class="status-badge">PAID</span>
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
      
      <p>We appreciate your prompt payment and continued business. If you need any receipts or have questions, please don't hesitate to reach out.</p>
      <p>Best regards,<br><strong>{company_name}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated receipt. Please keep this for your records.</p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

export default emailTemplates;
