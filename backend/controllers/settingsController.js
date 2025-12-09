import Settings from "../models/Settings.js";
import companyDetailsConfig from "../config/companyDetails.js";

// @desc    Get global settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      // Create default settings if not exists
      settings = await Settings.create({});
    }

    // Convert to object to allow modification
    let settingsObj = settings.toObject();

    // Fill in missing company details from config if not present in DB
    const currentDetails = settingsObj.company_details || {};
    const mergedCompanyDetails = { ...currentDetails };

    // Keys to check from config: name, address, contact, email, website, etc.
    // Note: config uses 'gstNumber' but model uses 'gst_number'. We map accordingly if needed,
    // but here we just merge matching keys usually.
    // companyDetailsConfig: { name, address, contact, email, gstNumber, LUTNumber }
    // model: { name, address, contact, email, gst_number, LUTNumber, website, logo }

    if (!mergedCompanyDetails.name)
      mergedCompanyDetails.name = companyDetailsConfig.name;
    if (!mergedCompanyDetails.address)
      mergedCompanyDetails.address = companyDetailsConfig.address;
    if (!mergedCompanyDetails.contact)
      mergedCompanyDetails.contact = companyDetailsConfig.contact;
    if (!mergedCompanyDetails.email)
      mergedCompanyDetails.email = companyDetailsConfig.email;
    if (!mergedCompanyDetails.gst_number)
      mergedCompanyDetails.gst_number = companyDetailsConfig.gstNumber;
    if (!mergedCompanyDetails.LUTNumber)
      mergedCompanyDetails.LUTNumber = companyDetailsConfig.LUTNumber;

    // Website might correspond to company website, usually derived or hardcoded?
    // companyDetailsConfig doesn't have website, so leave as is (which defuls to '#' in templates if empty)

    settingsObj.company_details = mergedCompanyDetails;

    res.status(200).json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private
import { encrypt } from "./emailController.js";

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    const updateData = { ...req.body };

    // Encrypt SMTP password if it's being updated and different from existing
    if (updateData.smtp_settings && updateData.smtp_settings.pass) {
      const existingPass = settings?.smtp_settings?.pass;
      // Only encrypt if it's a new password (not matching the stored encrypted one)
      if (!existingPass || updateData.smtp_settings.pass !== existingPass) {
        updateData.smtp_settings.pass = encrypt(updateData.smtp_settings.pass);
      }
    }
    // If updating smtp_settings but pass is empty/masked, keep existing pass
    else if (updateData.smtp_settings && settings?.smtp_settings?.pass) {
      updateData.smtp_settings.pass = settings.smtp_settings.pass;
    }

    if (!settings) {
      settings = await Settings.create(updateData);
    } else {
      settings = await Settings.findByIdAndUpdate(
        settings._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export { getSettings, updateSettings };
