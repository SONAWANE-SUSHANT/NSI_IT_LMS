const { loginUser } = require("../services/auth.service");
const {
  handleStudentDeviceLogin,
  isStudent,
} = require("../services/device.service");
const { generateToken } = require("../utils/jwt");

const login = async (req, res) => {
  try {
    const { username, password, device } = req.body;

    const user = await loginUser(username, password);

    // Devices are tracked for every role. Only STUDENT accounts are subject
    // to the two-active-device enforcement rule.
    await handleStudentDeviceLogin(
      user,
      device || {},
      req.ip,
      req.get("user-agent") || ""
    );

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,

        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          username: user.username,
          role_id: user.role_id,
          role: user.role.name,
          device_code: user.device_code,
          profile_photo: user.profile_photo,
          status: user.status,
        },
      },
    });
  } catch (error) {
    const statusCode = error.status || (error.code === "DEVICE_LIMIT_REACHED" ? 403 : 401);

    return res.status(statusCode).json({
      success: false,
      ...(error.code ? { code: error.code } : {}),
      message: error.message,
    });
  }
};

module.exports = {
  login,
};
