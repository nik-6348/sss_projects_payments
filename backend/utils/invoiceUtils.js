import Settings from "../models/Settings.js";

/**
 * Calculate current financial year (April to March)
 * @returns {string} Format: YYYY-YY (e.g., 2024-25)
 */
export const getFinancialYear = () => {
  const today = new Date();
  const month = today.getMonth(); // 0-11 (Jan is 0, Mar is 2, Apr is 3)
  const year = today.getFullYear();

  let startYear, endYear;

  if (month >= 3) {
    // April (3) to December
    startYear = year;
    endYear = year + 1;
  } else {
    // January to March (2)
    startYear = year - 1;
    endYear = year;
  }

  // Format endYear to 2 digits
  const endYearShort = endYear.toString().slice(-2);

  return `${startYear}-${endYearShort}`;
};

/**
 * Generate next invoice number
 * Format: INV-{FinancialYear}/{Sequence}
 * Sequence is padded to 4 digits (e.g., 0158)
 */
export const generateInvoiceNumber = async () => {
  const financialYear = getFinancialYear();

  // Find and update the settings atomically to get the next sequence
  // If settings don't exist, create them
  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { "invoice_settings.current_sequence": 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const sequence = settings.invoice_settings.current_sequence;

  // Pad sequence with leading zeros (4 digits)
  const paddedSequence = sequence.toString().padStart(4, "0");

  return `INV-${financialYear}/${paddedSequence}`;
};
