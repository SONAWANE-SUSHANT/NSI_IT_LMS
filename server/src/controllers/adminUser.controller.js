const {
  createUserByAdmin,
  getUsersByAdmin,
  getUserByIdByAdmin,
  updateUserByAdmin,
  updateUserStatusByAdmin,
  importStudentsByAdmin,
} = require("../services/adminUser.service");

const createUser = async (req, res) => {
  try {
    const user = await createUserByAdmin(
      req.body,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: "User account created successfully",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const { role_id, status, search } = req.query;
    const users = await getUsersByAdmin({
      role_id: role_id ? parseInt(role_id, 10) : undefined,
      status,
      search,
    });

    return res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve users",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await getUserByIdByAdmin(req.params.id);

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await updateUserByAdmin(
      req.params.id,
      req.body,
      req.user.id
    );

    return res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const user = await updateUserStatusByAdmin(
      req.params.id,
      status,
      req.user.id
    );

    return res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: user,
    });
  } catch (error) {
    const statusCode = error.message === "User not found" ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const importStudents = async (req, res) => {
  try {
    const summary = await importStudentsByAdmin(req.body.rows, req.user.id);

    return res.status(201).json({
      success: true,
      message: "Student import completed",
      data: summary,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to import students",
    });
  }
};

const { getUserDevices, revokeUserDevice, deleteUserDevice } = require("../services/device.service");

const getDevices = async (req, res) => {
  try {
    const devices = await getUserDevices(Number(req.params.id));
    return res.json({
      success: true,
      data: devices,
      count: devices.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load user devices",
    });
  }
};

const removeDevice = async (req, res) => {
  try {
    const { id, deviceId } = req.params;
    const result = await revokeUserDevice(Number(id), Number(deviceId));
    return res.json({
      success: true,
      message: "Device removed successfully",
      data: result,
    });
  } catch (error) {
    const status = error.message === "Device not found" ? 404 : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  updateUserStatus,
  importStudents,
  getDevices,
  removeDevice,
};
