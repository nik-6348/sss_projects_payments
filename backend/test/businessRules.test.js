import test from "node:test";
import assert from "node:assert/strict";
import { getFinancialYear } from "../utils/invoiceUtils.js";
import { applyProjectTaxAndConversion } from "../controllers/projectController.js";
import {
  calculateInvoiceFinancials,
  toBoolean,
} from "../controllers/invoiceController.js";

test("getFinancialYear follows April to March financial year", () => {
  assert.equal(getFinancialYear(new Date(2026, 2, 31)), "2025-26");
  assert.equal(getFinancialYear(new Date(2026, 3, 1)), "2026-27");
});

test("getFinancialYear accepts date strings", () => {
  assert.equal(getFinancialYear("2027-01-15T00:00:00.000Z"), "2026-27");
});

test("applyProjectTaxAndConversion defaults INR projects safely", () => {
  const projectData = {
    total_amount: 1000,
  };

  applyProjectTaxAndConversion(projectData);

  assert.equal(projectData.currency, "INR");
  assert.equal(projectData.include_gst, false);
  assert.equal(projectData.gst_percentage, 0);
  assert.equal(projectData.include_tds, false);
  assert.equal(projectData.tds_percentage, 0);
  assert.equal(projectData.usd_to_inr_rate, 0);
  assert.equal(projectData.inr_converted_amount, 0);
});

test("applyProjectTaxAndConversion removes project tax and conversion snapshots for USD projects", () => {
  const projectData = {
    currency: "USD",
    total_amount: 100,
    include_gst: true,
    gst_percentage: 18,
    include_tds: true,
    tds_percentage: 5,
    usd_to_inr_rate: 83.257,
  };

  applyProjectTaxAndConversion(projectData);

  assert.equal(projectData.currency, "USD");
  assert.equal(projectData.include_gst, false);
  assert.equal(projectData.gst_percentage, 0);
  assert.equal(projectData.include_tds, false);
  assert.equal(projectData.tds_percentage, 0);
  assert.equal(projectData.usd_to_inr_rate, 0);
  assert.equal(projectData.inr_converted_amount, 0);
});

test("applyProjectTaxAndConversion keeps project tax disabled for INR projects", () => {
  const projectData = {
    currency: "INR",
    total_amount: 1000,
    include_gst: false,
    gst_percentage: 18,
  };

  applyProjectTaxAndConversion(projectData);

  assert.equal(projectData.currency, "INR");
  assert.equal(projectData.include_gst, false);
  assert.equal(projectData.gst_percentage, 0);
  assert.equal(projectData.usd_to_inr_rate, 0);
  assert.equal(projectData.inr_converted_amount, 0);
});

test("applyProjectTaxAndConversion ignores project-level USD conversion", () => {
  const projectData = {
    currency: "USD",
    total_amount: 12.345,
    usd_to_inr_rate: 83.333,
  };

  applyProjectTaxAndConversion(projectData);

  assert.equal(projectData.usd_to_inr_rate, 0);
  assert.equal(projectData.inr_converted_amount, 0);
});

test("calculateInvoiceFinancials calculates subtotal, GST, and total", () => {
  const result = calculateInvoiceFinancials({
    services: [{ amount: 1000 }, { amount: 500 }],
    body: {},
    project: {
      currency: "INR",
    },
    settings: {
      gst_settings: { enable_gst: true, default_percentage: 18 },
      tds_settings: { default_percentage: 10 },
    },
  });

  assert.deepEqual(result, {
    currency: "INR",
    subtotal: 1500,
    gst_percentage: 18,
    gst_amount: 270,
    include_gst: true,
    tds_percentage: 10,
    tds_amount: 0,
    include_tds: false,
    total_amount: 1770,
  });
});

test("calculateInvoiceFinancials disables GST and TDS for USD invoices", () => {
  const result = calculateInvoiceFinancials({
    services: [{ amount: 1000 }],
    body: {
      include_gst: "true",
      include_tds: "true",
      tds_percentage: 10,
    },
    project: {
      currency: "USD",
    },
    settings: {
      gst_settings: { enable_gst: true, default_percentage: 18 },
      tds_settings: { default_percentage: 10 },
    },
  });

  assert.equal(result.currency, "USD");
  assert.equal(result.include_gst, false);
  assert.equal(result.gst_percentage, 0);
  assert.equal(result.gst_amount, 0);
  assert.equal(result.include_tds, false);
  assert.equal(result.tds_amount, 0);
  assert.equal(result.total_amount, 1000);
});

test("calculateInvoiceFinancials allows request body to override GST settings", () => {
  const result = calculateInvoiceFinancials({
    services: [{ amount: 999.99 }],
    body: {
      currency: "INR",
      include_gst: "true",
      gst_percentage: 12,
      include_tds: "false",
      tds_percentage: 5,
    },
    project: {
      currency: "INR",
    },
    settings: {
      gst_settings: { enable_gst: false, default_percentage: 18 },
      tds_settings: { default_percentage: 10 },
    },
  });

  assert.equal(result.subtotal, 999.99);
  assert.equal(result.include_gst, true);
  assert.equal(result.gst_percentage, 12);
  assert.equal(result.gst_amount, 120);
  assert.equal(result.include_tds, false);
  assert.equal(result.tds_percentage, 5);
  assert.equal(result.tds_amount, 0);
  assert.equal(result.total_amount, 1119.99);
});

test("calculateInvoiceFinancials can fall back to existing invoice GST values", () => {
  const result = calculateInvoiceFinancials({
    services: [{ amount: 500 }],
    body: {},
    existingInvoice: {
      currency: "INR",
      include_gst: true,
      gst_percentage: 5,
    },
  });

  assert.equal(result.currency, "INR");
  assert.equal(result.gst_amount, 25);
  assert.equal(result.tds_amount, 0);
  assert.equal(result.total_amount, 525);
});

test("calculateInvoiceFinancials never returns a negative payable total", () => {
  const result = calculateInvoiceFinancials({
    services: [{ amount: 100 }],
    body: {
      include_tds: true,
      tds_percentage: 200,
    },
    project: {
      currency: "INR",
    },
    settings: {
      gst_settings: { enable_gst: false, default_percentage: 18 },
      tds_settings: { default_percentage: 10 },
    },
  });

  assert.equal(result.total_amount, 100);
});

test("toBoolean respects string booleans and fallback values", () => {
  assert.equal(toBoolean("true"), true);
  assert.equal(toBoolean("false", true), false);
  assert.equal(toBoolean(undefined, true), true);
  assert.equal(toBoolean(null, false), false);
});
