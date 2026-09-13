const profileService = require("../services/profile.service");

/**
 * GET /api/profile
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user.id);
    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT/PATCH /api/profile
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const updated = await profileService.updateProfile(req.user.id, req.body);
    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT/PATCH /api/profile/photo
 */
const uploadMyPhoto = async (req, res, next) => {
  try {
    const result = await profileService.uploadPhoto(req.user.id, req.body);
    return res.json({
      success: true,
      message: "Photo updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadMyPhoto,
};
