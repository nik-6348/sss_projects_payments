import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// --- CONFIGURATION ---
const COLORS = {
  primary: [32, 48, 80], // Dark Blue
  secondary: [100, 100, 100], // Grey
  accent: [240, 240, 240], // Light Grey
  paid: [76, 175, 80], // Green
  unpaid: [244, 67, 54], // Red
  overdue: [244, 67, 54], // Red
  cancelled: [158, 158, 158], // Grey
  tableBorder: [200, 200, 200], // Light Grey
};

const RIBBON = {
  width: 50,
  height: 16,
  arrowDepth: 12,
  yPos: 8,
};

// --- HELPER FUNCTIONS ---

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getCurrencySymbol = (currency) => {
  if (currency === "USD") return "$";
  if (currency === "INR") return "Rs.";
  return "Rs."; // Default fallback as per user request
};

const drawStatusRibbon = (doc, pageWidth, status = "UNPAID") => {
  if (!status) return;
  const statusUpper = status.toUpperCase();
  let ribbonColor = COLORS.unpaid;

  if (statusUpper === "PAID") ribbonColor = COLORS.paid;
  if (statusUpper === "CANCELLED") ribbonColor = COLORS.cancelled;
  if (statusUpper === "OVERDUE") ribbonColor = COLORS.overdue;

  doc.saveGraphicsState();

  const { width, height, arrowDepth, yPos } = RIBBON;

  // Polygon Points (Pointing Left)
  const x1 = pageWidth;
  const y1 = yPos;
  const x2 = pageWidth;
  const y2 = yPos + height;
  const x3 = pageWidth - width;
  const y3 = yPos + height;
  const x4 = pageWidth - width - arrowDepth;
  const y4 = yPos + height / 2;
  const x5 = pageWidth - width;
  const y5 = yPos;

  doc.setFillColor(...ribbonColor);
  doc.path([
    { op: "m", c: [x1, y1] },
    { op: "l", c: [x2, y2] },
    { op: "l", c: [x3, y3] },
    { op: "l", c: [x4, y4] },
    { op: "l", c: [x5, y5] },
    { op: "h" },
  ]);
  doc.fill();

  // Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(
    statusUpper,
    pageWidth - (width + arrowDepth) / 2,
    yPos + height / 2,
    {
      align: "center",
      baseline: "middle",
    }
  );

  doc.restoreGraphicsState();
};

const getColumns = (invoiceData) => {
  const { project_type, allocation_type } = invoiceData.project_id || {};

  // Default Columns
  let columns = [
    { header: "Description", dataKey: "description" },
    { header: "Amount", dataKey: "amount" },
  ];

  // Employee Based / Hourly Billing Columns
  if (
    project_type === "hourly_billing" &&
    allocation_type === "employee_based"
  ) {
    columns = [
      { header: "Role", dataKey: "team_role" },
      { header: "Description", dataKey: "description" },
      { header: "Hours", dataKey: "hours" },
      { header: "Rate", dataKey: "rate" },
      { header: "Amount", dataKey: "amount" },
    ];
  }
  return columns;
};

const getTableData = (invoiceData, currencySymbol) => {
  const { project_type, allocation_type } = invoiceData.project_id || {};
  const isEmployeeBased =
    project_type === "hourly_billing" && allocation_type === "employee_based";

  return invoiceData.services.map((service, index) => {
    // Base row
    const row = {
      description: service.description || `Service ${index + 1}`,
      amount: `${currencySymbol}${Number(service.amount).toFixed(2)}`,
    };

    if (isEmployeeBased) {
      row.team_role = service.team_role || "-";
      row.description = service.description || "-";
      row.hours = service.hours || 0;
      row.rate = service.rate
        ? `${currencySymbol}${Number(service.rate).toFixed(2)}`
        : "-";
    }

    return row;
  });
};

const formatCurrency = (amount, symbol) => {
  return `${symbol}${Number(amount || 0).toFixed(2)}`;
};

// --- MAIN GENERATOR ---

const generateInvoicePDF = (
  invoiceData,
  clientData,
  bankDetails,
  companyDetails,
  logoBase64,
  signatureBase64
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginX = 15;
  const currencySymbol = getCurrencySymbol(invoiceData.currency);

  // 1. Status Ribbon
  drawStatusRibbon(doc, pageWidth, invoiceData.status || "UNPAID");

  // 2. Company Logo
  let logoHeight = 0;
  if (logoBase64) {
    try {
      const imgProps = doc.getImageProperties(logoBase64);
      const maxWidth = 50;
      const maxHeight = 25;
      const ratio = Math.min(
        maxWidth / imgProps.width,
        maxHeight / imgProps.height
      );
      const logoWidth = imgProps.width * ratio;
      logoHeight = imgProps.height * ratio;
      doc.addImage(logoBase64, marginX, 10, logoWidth, logoHeight);
    } catch (e) {
      console.warn("Invalid Logo Base64");
    }
  }

  let cursorY = Math.max(10 + logoHeight + 8, 32);

  // 3. Company Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(companyDetails.name || "Company Name", marginX, cursorY);

  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.secondary);

  const address = doc.splitTextToSize(companyDetails.address || "", 80);
  doc.text(address, marginX, cursorY);
  cursorY += address.length * 4;

  if (companyDetails.email) {
    doc.text(`Email: ${companyDetails.email}`, marginX, cursorY);
    cursorY += 5;
  }
  if (companyDetails.contact) {
    doc.text(`Phone: ${companyDetails.contact}`, marginX, cursorY);
    cursorY += 5;
  }

  // Divider
  cursorY += 4;
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 8;

  // 4. Invoice Metadata & Client Details
  const sectionStartY = cursorY;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text("INVOICE", marginX, cursorY);
  cursorY += 12;

  // To (Client)
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("To,", marginX, cursorY);
  cursorY += 6;

  doc.setFontSize(10);
  doc.text(clientData.name || "Client Name", marginX, cursorY);
  cursorY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const clientAddressFn = () => {
    if (!clientData.address) return "N/A";
    const { street, city, state, zip } = clientData.address;
    return [street, city, state, zip].filter(Boolean).join(", ");
  };

  const clientAddrLines = doc.splitTextToSize(clientAddressFn(), 80);
  doc.text(clientAddrLines, marginX, cursorY);
  cursorY += clientAddrLines.length * 4;

  if (clientData.gst_number) {
    cursorY += 2;
    doc.text(`GSTIN: ${clientData.gst_number}`, marginX, cursorY);
  }

  // Invoice Details (Right Aligned)
  let rightY = sectionStartY + 14;
  const labelX = pageWidth - 60;
  const valueX = pageWidth - marginX;

  const addMetaRow = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(label, labelX, rightY, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    doc.text(value, valueX, rightY, { align: "right" });
    rightY += 6;
  };

  addMetaRow("INVOICE NO:", invoiceData.invoice_number);
  addMetaRow("DUE DATE:", formatDate(invoiceData.due_date));

  // Align content start for table
  cursorY = Math.max(cursorY, rightY) + 4;

  // 5. Services Table
  const columns = getColumns(invoiceData);
  const bodyData = getTableData(invoiceData, currencySymbol);

  // Footer Rows calculation
  const subTotalEx = formatCurrency(invoiceData.subtotal, currencySymbol);
  const taxLabel = `GST (${invoiceData.gst_percentage || 0}%)`;
  const taxAmount = formatCurrency(invoiceData.gst_amount, currencySymbol);
  const totalPayable = formatCurrency(invoiceData.total_amount, currencySymbol);

  // Push footer rows for AutoTable
  bodyData.push(
    { description: "Sub Total", amount: subTotalEx, _type: "summary" },
    { description: taxLabel, amount: taxAmount, _type: "summary" },
    { description: "Total Payable", amount: totalPayable, _type: "grand_total" }
  );

  autoTable(doc, {
    startY: cursorY + 5,
    columns: columns,
    body: bodyData,
    theme: "plain",
    headStyles: {
      fillColor: false, // Disable default fill to use roundedRect in willDrawCell
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
      minCellHeight: 12,
    },
    bodyStyles: {
      textColor: 50,
      halign: "center",
      minCellHeight: 10,
    },
    columnStyles: {
      team_role: { halign: "left" },
      description: { halign: "left" },
      amount: { halign: "right", fontStyle: "bold" },
      hours: { halign: "center" },
      rate: { halign: "right" },
    },
    willDrawCell: (data) => {
      // Rounded Header Background
      if (data.section === "head" && data.column.index === 0) {
        const tableWidth = pageWidth - marginX * 2;
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(
          marginX,
          data.cell.y,
          tableWidth,
          data.row.height,
          2,
          2,
          "F"
        );
        // Cover bottom corners to make it look like just top rounded if needed,
        // but for full rect header usually acceptable.
        // To make it look like a standard table header with flat bottom:
        doc.rect(
          marginX,
          data.cell.y + data.row.height - 2,
          tableWidth,
          2,
          "F"
        );
      }
    },
    didParseCell: (data) => {
      const row = data.row.raw;
      // Handle Summary Rows
      if (row._type) {
        // Span description column
        if (data.column.index === 0) {
          data.cell.colSpan = columns.length - 1;
          data.cell.styles.halign = "right";
          data.cell.text = row.description;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = COLORS.primary;
        } else if (data.column.dataKey === "amount") {
          // Keep amount column visible
        } else {
          data.cell.styles.display = "none";
        }

        if (row._type === "grand_total") {
          data.cell.styles.fillColor = [245, 245, 245];
          if (data.column.dataKey === "amount") {
            data.cell.styles.textColor = [0, 0, 0];
            data.cell.styles.fontSize = 12;
          }
        }
      }
    },
    didDrawCell: (data) => {
      // Custom Borders
      const { cell, doc } = data;
      doc.setDrawColor(...COLORS.tableBorder);
      doc.setLineWidth(0.1);

      // Vertical lines (except last col right edge handled by page border logic usually)
      if (data.column.index < columns.length - 1) {
        doc.line(
          cell.x + cell.width,
          cell.y,
          cell.x + cell.width,
          cell.y + cell.height
        );
      }
      // Horizontal line at bottom of each row
      doc.line(
        cell.x,
        cell.y + cell.height,
        cell.x + cell.width,
        cell.y + cell.height
      );
    },
    didDrawPage: (data) => {
      // Outer Border
      const tableHeight = data.cursor.y - data.settings.startY;
      doc.setDrawColor(...COLORS.tableBorder);
      doc.roundedRect(
        marginX,
        data.settings.startY,
        pageWidth - marginX * 2,
        tableHeight,
        2,
        2,
        "S"
      );
    },
    margin: { left: marginX, right: marginX },
  });

  // 6. Footer (Bank Details & Signature)
  let footerY = doc.lastAutoTable.finalY + 15;

  // Check for page break - Ensure space for both blocks (approx 60 units)
  if (footerY + 60 > pageHeight) {
    doc.addPage();
    footerY = 20;
  }

  // --- LEFT: Bank Info ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14); // Keeping user's font size
  doc.setTextColor(...COLORS.primary);
  doc.text("Bank Details:", marginX, footerY);

  let leftY = footerY + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.secondary);

  const bankLines = [
    `Bank: ${bankDetails.bankName || "-"}`,
    `Account Type: ${bankDetails.accountType || "-"}`,
    `A/C No: ${bankDetails.accountNumber || "-"}`,
    `IFSC: ${bankDetails.ifscCode || "-"}`,
    bankDetails.swiftCode ? `Swift: ${bankDetails.swiftCode}` : null,
    `Holder: ${bankDetails.accountHolderName || "-"}`,
  ].filter(Boolean);

  bankLines.forEach((line) => {
    doc.text(line, marginX, leftY);
    leftY += 4.5;
  });

  // --- RIGHT: Signature ---
  // Start at the same Y as Bank Info Header
  let footerRightY = footerY;
  const sigCx = pageWidth - 45;

  if (signatureBase64) {
    try {
      const sProps = doc.getImageProperties(signatureBase64);
      const sW = 60;
      const sH = 30;
      const sRatio = Math.min(sW / sProps.width, sH / sProps.height);
      // Place image slightly below to align with text flow or parallel to bank details
      doc.addImage(
        signatureBase64,
        sigCx - (sProps.width * sRatio) / 2,
        footerRightY,
        sProps.width * sRatio,
        sProps.height * sRatio
      );
      footerRightY += sProps.height * sRatio;
    } catch (e) {
      /* ignore */
    }
  } else {
    footerRightY += 20; // Space for missing sig
  }

  footerRightY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(`For, ${companyDetails.name || "Company"}`, sigCx, footerRightY, {
    align: "center",
  });
  footerRightY += 4;
  doc.setFont("helvetica", "bolditalic");
  doc.text("Authorized Signatory", sigCx, footerRightY, { align: "center" });

  // Return Base64 (without prefix)
  return doc.output("dataurlstring").split(",")[1];
};

export { generateInvoicePDF };
