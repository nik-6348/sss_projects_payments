# SSS Payments Dashboard - Calculation And Flow Guide

## 1. Full Application Flow

The application follows this business flow:

```text
Login
  -> Create Client
  -> Create Project
  -> Create Invoice
  -> Generate/View PDF
  -> Send Email or WhatsApp
  -> Record Payment
  -> Update Invoice Status
  -> Dashboard Totals Update
```

## 2. Project Calculation

Project amount is calculated when a project is created or updated.

Main fields:

```text
project_type:
  fixed_contract
  monthly_retainer
  hourly_billing

allocation_type:
  overall
  employee_based
```

### Fixed Contract

For fixed contract projects:

```text
total_amount = contract_amount
```

Example:

```text
contract_amount = 50000

total_amount = 50000
```

### Monthly Retainer - Overall

For monthly retainer projects:

```text
durationMonths = days between start_date and end_date / 30
total_amount = monthly_fee * durationMonths
```

Example:

```text
monthly_fee = 20000
durationMonths = 3

total_amount = 20000 * 3
total_amount = 60000
```

### Hourly Billing - Overall

For hourly billing projects:

```text
total_amount = hourly_rate * estimated_hours
```

Example:

```text
hourly_rate = 1000
estimated_hours = 80

total_amount = 1000 * 80
total_amount = 80000
```

### Employee-Based Hourly Billing

For employee-based hourly projects:

```text
monthlyBurn = sum(member.rate * member.monthly_hours)
total_amount = monthlyBurn * durationMonths
```

Example:

```text
Developer:
  rate = 1000
  monthly_hours = 80
  amount = 80000

Designer:
  rate = 800
  monthly_hours = 50
  amount = 40000

monthlyBurn = 80000 + 40000
monthlyBurn = 120000

durationMonths = 2

total_amount = 120000 * 2
total_amount = 240000
```

### Employee-Based Monthly Retainer

For employee-based monthly retainer:

```text
monthlyBurn = sum(member.rate)
total_amount = monthlyBurn * durationMonths
```

Example:

```text
Developer monthly fee = 70000
Designer monthly fee = 50000

monthlyBurn = 70000 + 50000
monthlyBurn = 120000

durationMonths = 3

total_amount = 120000 * 3
total_amount = 360000
```

## 3. Project Currency, GST, And TDS

After project amount is calculated, tax and currency rules are applied.

### INR Project Defaults

For INR projects:

```text
currency = INR
include_gst = true by default
gst_percentage = 18 by default
include_tds = false by default
tds_percentage = 10 by default
usd_to_inr_rate = 0
inr_converted_amount = 0
```

### USD Project Rules

For USD projects:

```text
include_gst = false
gst_percentage = 0
inr_converted_amount = total_amount * usd_to_inr_rate
```

Example:

```text
project amount = USD 100
usd_to_inr_rate = 83.25

inr_converted_amount = 100 * 83.25
inr_converted_amount = INR 8325
```

## 4. Invoice Number Calculation

Invoice numbers use the Indian financial year from April to March.

```text
January to March 2026 = FY 2025-26
April to December 2026 = FY 2026-27
```

Invoice format:

```text
INV-{financialYear}/{sequence}
```

Example:

```text
financialYear = 2026-27
sequence = 1

invoice_number = INV-2026-27/0001
```

The sequence is stored in Settings and increases for every new invoice.

## 5. Invoice Calculation

Invoice calculation is based on services.

Formula:

```text
subtotal = sum(service.amount)
gst_amount = subtotal * gst_percentage / 100
tds_amount = subtotal * tds_percentage / 100
total_amount = subtotal + gst_amount - tds_amount
balance_due = total_amount
amount = total_amount
```

### INR Invoice With GST And TDS

Example:

```text
Service 1 = 1000
Service 2 = 500

subtotal = 1000 + 500
subtotal = 1500

GST = 18%
gst_amount = 1500 * 18 / 100
gst_amount = 270

TDS = 10%
tds_amount = 1500 * 10 / 100
tds_amount = 150

total_amount = 1500 + 270 - 150
total_amount = 1620

balance_due = 1620
```

### INR Invoice Without GST

Example:

```text
subtotal = 1500
include_gst = false
include_tds = false

gst_amount = 0
tds_amount = 0

total_amount = 1500
```

### USD Invoice

For USD invoices, GST is always disabled.

Example:

```text
subtotal = 1000
currency = USD
include_gst = true from request

Backend forces:
include_gst = false
gst_amount = 0

include_tds = true
tds_percentage = 10
tds_amount = 1000 * 10 / 100
tds_amount = 100

total_amount = 1000 - 100
total_amount = 900
```

## 6. Project Budget Check

Before creating or updating an invoice, the backend checks if the project budget is exceeded.

Important rule:

```text
Budget check uses invoice subtotal, not GST-included total.
```

Formula:

```text
currentUsedBudget = sum(existing invoice subtotals)
newUsedBudget = currentUsedBudget + newInvoiceSubtotal

newUsedBudget must be <= project.total_amount
```

Example:

```text
project.total_amount = 5000
existing invoice subtotal = 3000
new invoice subtotal = 2500

newUsedBudget = 3000 + 2500
newUsedBudget = 5500

5500 > 5000

Result: invoice rejected with budget exceeded error
```

Valid example:

```text
project.total_amount = 5000
existing invoice subtotal = 3000
new invoice subtotal = 2000

newUsedBudget = 3000 + 2000
newUsedBudget = 5000

5000 <= 5000

Result: invoice allowed
```

## 7. Invoice Status Flow

Common invoice statuses:

```text
draft
sent
unpaid
partial
paid
overdue
cancelled
```

Typical flow:

```text
draft
  -> unpaid when invoice is sent
  -> partial when some payment is received
  -> paid when full payment is received
```

Overdue flow:

```text
sent/unpaid invoice crosses due date
  -> overdue
```

Cancelled flow:

```text
invoice cancelled manually
  -> cancelled
```

## 8. Payment Calculation

When payment is recorded against an invoice:

```text
newPaidAmount = oldPaidAmount + paymentAmount
payableAmount = invoice.total_amount or invoice.amount
newBalanceDue = payableAmount - newPaidAmount
```

Status update:

```text
if newBalanceDue <= 0:
  invoice.status = paid

else if newPaidAmount > 0:
  invoice.status = partial
```

### Partial Payment Example

```text
invoice.total_amount = 1620
oldPaidAmount = 0
paymentAmount = 500

newPaidAmount = 0 + 500
newPaidAmount = 500

newBalanceDue = 1620 - 500
newBalanceDue = 1120

status = partial
```

### Full Payment Example

```text
invoice.total_amount = 1620
oldPaidAmount = 500
paymentAmount = 1120

newPaidAmount = 500 + 1120
newPaidAmount = 1620

newBalanceDue = 1620 - 1620
newBalanceDue = 0

status = paid
```

### Overpayment Example

```text
invoice.total_amount = 1620
oldPaidAmount = 0
paymentAmount = 1700

newPaidAmount = 1700
newBalanceDue = 1620 - 1700
newBalanceDue = -80

status = paid
```

Note: current backend marks invoice as paid if balance is zero or below.

## 9. Delete And Restore Logic

Draft invoices are hard deleted.

```text
draft invoice delete
  -> permanently deleted
```

Sent, unpaid, partial, paid, overdue, or cancelled invoices use soft delete.

```text
non-draft invoice delete
  -> isDeleted = true
  -> deletion_remark is required
```

Deleted invoice restore:

```text
isDeleted = false
```

## 10. Duplicate Invoice Logic

When an invoice is duplicated:

```text
new invoice number is generated
status = draft
issue_date = today
due_date = today
paid_amount = 0
balance_due = total_amount
isDeleted = false
pdf_base64 is removed
pdf_generated_at is removed
status_history is reset
```

The duplicate invoice still goes through the project budget check.

## 11. PDF And Email Flow

PDF generation uses:

```text
invoice details
project details
client details
bank details
company settings
```

When invoice is sent by email:

```text
1. Invoice is fetched
2. Client and bank details are fetched
3. PDF is generated
4. PDF is saved on invoice as base64
5. Email is sent with PDF attachment
6. Draft invoice becomes unpaid
```

## 12. Dashboard Calculation

Dashboard totals are calculated from projects, invoices, and payments.

Common formulas:

```text
totalRevenue = sum(invoice.total_amount)
totalGST = sum(invoice.gst_amount)
totalPaid = sum(invoice.paid_amount)
totalDue = totalRevenue - totalPaid
```

Example:

```text
Invoice 1:
  total_amount = 1620
  paid_amount = 500
  gst_amount = 270

Invoice 2:
  total_amount = 2360
  paid_amount = 2360
  gst_amount = 360

totalRevenue = 1620 + 2360
totalRevenue = 3980

totalPaid = 500 + 2360
totalPaid = 2860

totalDue = 3980 - 2860
totalDue = 1120

totalGST = 270 + 360
totalGST = 630
```

## 13. End-To-End Example

### Step 1: Create Project

```text
project_type = fixed_contract
currency = INR
contract_amount = 100000
include_gst = true
gst_percentage = 18
include_tds = true
tds_percentage = 10

project.total_amount = 100000
```

### Step 2: Create Invoice

```text
Service 1 = 40000
Service 2 = 10000

subtotal = 50000

GST = 50000 * 18 / 100
GST = 9000

TDS = 50000 * 10 / 100
TDS = 5000

invoice.total_amount = 50000 + 9000 - 5000
invoice.total_amount = 54000

invoice.balance_due = 54000
invoice.status = draft
```

### Step 3: Send Invoice

```text
status changes from draft to unpaid
PDF is generated
email is sent
```

### Step 4: Record Payment

```text
payment = 20000

paid_amount = 20000
balance_due = 54000 - 20000
balance_due = 34000

status = partial
```

### Step 5: Record Final Payment

```text
payment = 34000

paid_amount = 20000 + 34000
paid_amount = 54000

balance_due = 0
status = paid
```

### Step 6: Dashboard

```text
totalRevenue = 54000
totalPaid = 54000
totalDue = 0
totalGST = 9000
```

## 14. Important Notes

- Project budget is based on invoice subtotal, not invoice total with GST/TDS.
- GST is disabled automatically for USD projects and USD invoices.
- TDS is subtracted from payable amount.
- Payment updates invoice status automatically.
- Draft invoice delete is permanent.
- Non-draft invoice delete is soft delete and requires a remark.
- Duplicate invoice always creates a new draft invoice number.
- Dashboard totals depend on saved invoice and payment values.

