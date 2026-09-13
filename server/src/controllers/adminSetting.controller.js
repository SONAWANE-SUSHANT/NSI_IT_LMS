const { Setting } = require("../models");

// Default initial settings
const DEFAULT_SETTINGS = [
  {
    setting_key: "platform_title",
    setting_value: "NSI IT LMS - Nityashree Infosystems",
    category: "GENERAL",
    description: "Display name of the LMS platform",
  },
  {
    setting_key: "contact_email",
    setting_value: "support@nsiit.com",
    category: "GENERAL",
    description: "Primary support and administration contact email",
  },
  {
    setting_key: "contact_phone",
    setting_value: "+91 98888 88888",
    category: "GENERAL",
    description: "Support helpline number",
  },
  {
    setting_key: "default_passing_marks",
    setting_value: "40.00",
    category: "ACADEMIC",
    description: "Default passing threshold percentage for quizzes and assessments",
  },
  {
    setting_key: "max_quiz_attempts",
    setting_value: "3",
    category: "ACADEMIC",
    description: "Standard allowed retake attempts per quiz",
  },
  {
    setting_key: "session_timeout_hours",
    setting_value: "24",
    category: "SECURITY",
    description: "Active session validity period in hours",
  },
  {
    setting_key: "allow_student_device_switch",
    setting_value: "true",
    category: "SECURITY",
    description: "Allow students to switch between authorized devices",
  },
];

const getSettings = async (req, res) => {
  try {
    // Seed defaults if empty
    const count = await Setting.count();
    if (count === 0) {
      await Setting.bulkCreate(DEFAULT_SETTINGS);
    }

    const settings = await Setting.findAll({
      order: [["category", "ASC"], ["id", "ASC"]],
    });

    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    return res.status(200).json({
      success: true,
      data: {
        raw: settings,
        settings: settingsMap,
      },
    });
  } catch (error) {
    console.error("Failed to load settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load platform settings",
      error: error.message,
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== "object") {
      return res.status(400).json({
        success: false,
        message: "Settings payload object is required",
      });
    }

    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      const existing = await Setting.findOne({ where: { setting_key: key } });
      if (existing) {
        existing.setting_value = String(value);
        await existing.save();
      } else {
        await Setting.create({
          setting_key: key,
          setting_value: String(value),
          category: "GENERAL",
        });
      }
    });

    await Promise.all(updatePromises);

    const updated = await Setting.findAll();
    const settingsMap = {};
    updated.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    return res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      data: settingsMap,
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update platform settings",
      error: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
