# Fix All 17 Logical Issues — Implementation Plan

## Real-World Tax Rules (for reference)

| Tax | INR (Domestic) | USD (Export) |
|-----|---------------|--------------|
| **GST** | Yes — 18% default (configurable) | **No** — exempt with LUT (Indian export rule) |
| **TDS** | Yes — deducted by client (10% default) | Configurable — usually No for foreign clients, but possible |

**Design decision:** GST applicability per currency and TDS applicability per currency will be **configurable in Settings**, not hard-coded. Default: GST=INR only, TDS=INR only but can be toggled for USD.

---

## Phase 1 — Settings Model & Backend Config (Foundation)

### [MODIFY] [Settings.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/models/Settings.js)

Add per-currency tax applicability settings:

```js
gst_settings: {
  default_percentage: 18,
  enable_gst: true,
  apply_to_inr: true,       // NEW
  apply_to_usd: false,      // NEW — GST disabled for USD by default
},
tds_settings: {
  default_percentage: 10,
  enable_tds: true,          // NEW — global TDS toggle
  apply_to_inr: true,        // NEW
  apply_to_usd: false,       // NEW — TDS disabled for USD by default
},
invoice_settings: {
  // NEW: track sequence per financial year
  sequence_by_fy: {
    type: Map,
    of: Number,
    default: {},
  },
  // Keep current_sequence as fallback
}
```

---

## Phase 2 — Fix Invoice Calculations (Issues 1, 6, 16)

### [MODIFY] [invoiceController.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/controllers/invoiceController.js)

**Issue 1 — Fix TDS calculation:**
- Read `enable_tds`, `apply_to_inr`, `apply_to_usd` from Settings
- Calculate TDS based on currency: `if (settings.tds_settings.enable_tds && settings.tds_settings['apply_to_' + currency.toLowerCase()])`
- Use `toBoolean(body.include_tds, ...)` instead of hard-coded `false`
- Calculate: `tds_amount = include_tds ? roundMoney((subtotal * tds_percentage) / 100) : 0`
- Fix formula: `total_amount = subtotal + gst_amount - tds_amount`

**Issue 6 — Fix `balance_due` on update:**
- When updating an invoice with services, calculate `balance_due = total_amount - (invoice.paid_amount || 0)` instead of `balance_due = total_amount`

**Issue 16 — Fix PDF function name:**
- Line 548: Change `generateInvoicePDF(...)` → `generatePDF(...)`

---

## Phase 3 — Fix Payment Controller (Issues 2, 4, 5)

### [MODIFY] [paymentController.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/controllers/paymentController.js)

**Issue 2 — Standardize payment basis:**
- `creditedAmount` = the actual amount credited to the invoice (net payment + TDS portion)
- This is correct for updating `invoice.paid_amount` — the client "pays" via TDS deduction too
- Document this clearly in code comments

**Issue 4 — Fix payment delete (reverse invoice state):**
```js
const deletePayment = async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);
  // ... existing checks ...
  
  // Reverse invoice financial state
  if (payment.invoice_id) {
    const invoice = await Invoice.findById(payment.invoice_id);
    if (invoice) {
      const creditedAmt = payment.credited_amount ?? payment.amount;
      invoice.paid_amount = Math.max(0, roundMoney((invoice.paid_amount || 0) - creditedAmt));
      invoice.balance_due = roundMoney((invoice.total_amount || invoice.amount) - invoice.paid_amount);
      
      // Recalculate status
      if (invoice.paid_amount <= 0) {
        invoice.status = 'unpaid';
      } else if (invoice.balance_due <= 0) {
        invoice.status = 'paid';
      } else {
        invoice.status = 'partial';
      }
      await invoice.save();
    }
  }
  
  await Payment.findByIdAndDelete(req.params.id);
};
```

**Issue 5 — Fix payment update (recalculate invoice state):**
```js
const updatePayment = async (req, res, next) => {
  const oldPayment = await Payment.findById(req.params.id);
  // ... existing checks ...
  
  // Reverse old payment effect on invoice, apply new
  if (oldPayment.invoice_id) {
    const invoice = await Invoice.findById(oldPayment.invoice_id);
    if (invoice) {
      const oldCredited = oldPayment.credited_amount ?? oldPayment.amount;
      // Remove old credit
      invoice.paid_amount = Math.max(0, roundMoney((invoice.paid_amount || 0) - oldCredited));
      
      // Apply new credit
      const newAmount = Number(req.body.amount ?? oldPayment.amount);
      const newCredited = Number(req.body.credited_amount ?? newAmount);
      invoice.paid_amount = roundMoney(invoice.paid_amount + newCredited);
      invoice.balance_due = roundMoney((invoice.total_amount || invoice.amount) - invoice.paid_amount);
      
      // Recalculate status
      if (invoice.balance_due <= 0) {
        invoice.status = 'paid';
        invoice.balance_due = 0;
      } else if (invoice.paid_amount > 0) {
        invoice.status = 'partial';
      } else {
        invoice.status = 'unpaid';
      }
      await invoice.save();
    }
  }
  
  payment = await Payment.findByIdAndUpdate(req.params.id, req.body, ...);
};
```

---

## Phase 4 — Fix Dashboard & Overdue (Issues 3, 7, 8, 11, 12, 17)

### [MODIFY] [dashboardController.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/controllers/dashboardController.js)

**Issue 11 — Fix swapped destructuring (L29-30 vs L51-54):**
Swap the order in the destructuring to match the Promise.all order:
```js
// Fix: swap these two
totalProjectValue,      // L51: $sum total_amount
projectStatusStats,     // L54: $group by status
```

**Issue 3 — Dashboard `totalPaid`:**
- In `getFilteredDashboardStats`, the `totalPaid` from `invoiceStats[0]?.paidAmount` is already correct (it sums `invoice.paid_amount` which tracks credited amounts). The Payment collection sum is for the "actual money received" view. Keep both but label correctly.
- Add `actualReceived: paymentStats[0]?.totalAmount || 0` alongside `totalPaid` so users can see both values.

**Issue 12 — Show overpayment:**
- Change `totalDue: totalDue > 0 ? totalDue : 0` → `totalDue: totalDue` (allow negative to indicate overpayment)

### [MODIFY] [checkOverdueInvoices.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/checkOverdueInvoices.js)

**Issue 7 — Include `unpaid` and `partial` in overdue checker:**
```js
status: { $in: ["sent", "unpaid", "partial", "overdue"] },
```
And mark `sent`/`unpaid`/`partial` → `overdue`:
```js
if (["sent", "unpaid", "partial"].includes(invoice.status)) {
  invoice.status = "overdue";
  // ... push history
}
```

### [MODIFY] [invoiceController.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/controllers/invoiceController.js) (updateInvoiceStatus)

**Issue 8 — Fix non-idempotent partial status update:**
- Remove the dual-path payment recording via status endpoint
- The `partial` case should NOT accumulate `paid_amount`. It should only SET the status. Payments should only come through `paymentController.createPayment`.
```js
} else if (status === "partial") {
  // Don't accumulate paid_amount here — let Payment controller handle it
  // This endpoint only changes the status label
}
```

**Issue 17 — Consistent `unpaid` handling:**
- Add `unpaid` to the overdue checker (done above in Issue 7 fix)

---

## Phase 5 — Fix Invoice Utils & Budget Check (Issues 10, 13)

### [MODIFY] [invoiceUtils.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/utils/invoiceUtils.js)

**Issue 10 — Per-financial-year sequence:**
```js
export const generateInvoiceNumber = async () => {
  const financialYear = getFinancialYear();
  const sequenceKey = `invoice_settings.sequence_by_fy.${financialYear}`;
  
  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { [sequenceKey]: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  
  const sequence = settings.invoice_settings?.sequence_by_fy?.get(financialYear) || 1;
  const paddedSequence = sequence.toString().padStart(4, "0");
  return `INV-${financialYear}/${paddedSequence}`;
};
```

### [MODIFY] [invoiceController.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/controllers/invoiceController.js) (duplicateInvoice)

**Issue 13 — Exclude source invoice from budget check:**
```js
const existingInvoices = await Invoice.aggregate([
  {
    $match: {
      project_id: sourceInvoice.project_id,
      isDeleted: false,
      status: { $ne: "cancelled" },
      _id: { $ne: sourceInvoice._id },  // ← ADD THIS
    },
  },
  { $group: { _id: null, total: { $sum: "$subtotal" } } },
]);
```

---

## Phase 6 — Fix Project Controller (Issue 9)

### [MODIFY] [projectController.js](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/backend/controllers/projectController.js)

**Issue 9 — Remove `applyProjectTaxAndConversion` hard-coding:**
Since tax defaults now live in Settings (not on the project), this function should only set currency default and clear conversion fields — NOT override GST/TDS:

```js
export const applyProjectTaxAndConversion = (projectData) => {
  projectData.currency = projectData.currency || "INR";
  // Only clear conversion fields — these are calculated at invoice/payment time
  projectData.usd_to_inr_rate = projectData.usd_to_inr_rate || 0;
  projectData.inr_converted_amount = projectData.inr_converted_amount || 0;
  // Don't override GST/TDS — they come from Settings at invoice creation time
};
```

---

## Phase 7 — Fix Frontend (Issues 14, 15)

### [MODIFY] [utils/index.ts](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/frontend/src/utils/index.ts)

**Issue 14 — Consistent basis for project stats:**
Use only ex-GST amounts for both progress and due amount (since `project.total_amount` is ex-GST):
```ts
const dueAmount = Math.max(calculatedTotal - paidAmountExGST, 0);
const progress = calculatedTotal > 0 ? (paidAmountExGST / calculatedTotal) * 100 : 0;
```

### [MODIFY] [PaymentForm.tsx](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/frontend/src/components/forms/PaymentForm.tsx)

**Issue 15 — Show overpayment amount:**
```ts
const remainingAfterPayment = currentDue - creditedAmount;  // Allow negative
// In JSX, show actual value (negative = overpayment):
{remainingAfterPayment < 0 ? `Overpaid by ${Math.abs(remainingAfterPayment)}` : remainingAfterPayment}
```

### [MODIFY] [SettingsPage.tsx](file:///d:/Projects/SSS_INTERNAL/sss_projects_payment/frontend/src/pages/SettingsPage.tsx)

Add new settings controls in the "Invoice Settings" section:
- **TDS Settings:** Enable/disable toggle + default percentage + per-currency applicability (INR/USD checkboxes)
- **GST Settings:** Per-currency applicability (INR checkbox already exists, add USD toggle)
- Make GST % and TDS % inputs always visible with clear labels

---

## Verification Plan

### Automated Tests
- No existing test suite to run

### Manual Verification
1. **TDS Calculation:** Create an INR invoice with TDS enabled → verify `total_amount = subtotal + gst - tds`
2. **USD Invoice:** Create a USD invoice → verify GST is disabled, TDS follows settings
3. **Payment Delete:** Record a payment, delete it → verify invoice `paid_amount` and `status` revert
4. **Payment Update:** Change payment amount → verify invoice recalculates
5. **Invoice Edit:** Edit a partially-paid invoice → verify `balance_due` accounts for payments
6. **Duplicate Invoice:** Duplicate near budget limit → verify no double-counting
7. **Overdue:** Create an `unpaid` invoice past due date, run overdue checker → verify it becomes `overdue`
8. **Dashboard:** Check `totalValue` is no longer 0, verify `totalDue` shows negative for overpayment
9. **Settings Page:** Configure TDS/GST per currency → verify it flows through to invoices
10. **Invoice Number:** Create invoices across FY boundary → verify sequence resets
