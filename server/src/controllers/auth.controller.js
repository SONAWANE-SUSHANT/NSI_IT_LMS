const { loginUser } = require("../services/auth.service");
const { generateToken } = require("../utils/jwt");
const { handleStudentDeviceLogin } = require("../services/device.service");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await loginUser(username, password);

    // Enforce student device limits & auto-register device
    await handleStudentDeviceLogin(user, req);

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
    const statusCode = error.statusCode || (error.code === "DEVICE_LIMIT_EXCEEDED" ? 403 : 401);
    return res.status(statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }
};

module.exports = {
  login,
};