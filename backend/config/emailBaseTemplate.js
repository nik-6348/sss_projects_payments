/**
 * Wraps the email content in a standardized HTML template with company branding
 * @param {string} content - The main body content of the email (HTML)
 * @param {object} companyDetails - Company details object (name, logo, website, address)
 * @returns {string} - The complete HTML email
 */
export const wrapEmailBody = (content, companyDetails = {}) => {
  const {
    name = "Company Name",
    // distinct variable to ensure we use this logo unless explicitly overridden by a non-empty value (if we wanted flexibility),
    // but user said "USE THIS LOGO", so we will default to it.
    logo = "https://singaji.in/assest/SSS-Logo.png",
    website = "#",
    address = "",
  } = companyDetails;

  // Check if content is already a full HTML document
  if (
    content.trim().startsWith("<!DOCTYPE html>") ||
    content.trim().startsWith("<html>")
  ) {
    return content;
  }

  // Convert newlines to breaks if content doesn't look like HTML
  const formattedContent =
    content.trim().startsWith("<") || content.includes("<br")
      ? content
      : content.replace(/\n/g, "<br>");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px; }
    .header { padding: 30px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e2e8f0; }
    .header img { max-height: 60px; max-width: 200px; height: auto; object-fit: contain; }
    .header h1 { margin: 10px 0 0; font-size: 24px; color: #1e293b; }
    .content { padding: 40px 30px; font-size: 16px; color: #334155; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 5px 0; }
    .footer a { color: #3b82f6; text-decoration: none; }
    
    /* Utility classes that might be used in content */
    .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .highlight { font-weight: 600; color: #1e293b; }
    .table-container { margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f8fafc; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    td { padding: 12px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logo ? `<img src="${logo}" alt="${name}" />` : `<h1>${name}</h1>`}
    </div>
    <div class="content">
      ${formattedContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${name}. All rights reserved.</p>
      ${address ? `<p>${address}</p>` : ""}
      ${
        website && website !== "#"
          ? `<p><a href="${website}" target="_blank">${website}</a></p>`
          : ""
      }
    </div>
  </div>
</body>
</html>
  `;
};
