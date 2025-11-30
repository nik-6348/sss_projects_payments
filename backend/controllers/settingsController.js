import Settings from "../models/Settings.js";

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

    res.status(200).json({
      success: true,
      data: settings,
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
