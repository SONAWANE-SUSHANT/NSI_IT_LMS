const sequelize = require("../config/database");
const { UserDevice, User } = require("../models");

const MAX_STUDENT_DEVICES = 2;

const DEVICE_LIMIT_MESSAGE =
  "Maximum device limit reached (2 active devices). Please contact an administrator to remove or revoke an existing device before logging in from a new device.";

const parseUserAgent = (userAgent = "") => {
  const ua = String(userAgent);

  let browser = "Unknown Browser";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";

  let operating_system = "Unknown OS";
  if (/Windows NT/i.test(ua)) operating_system = "Windows";
  else if (/Mac OS X/i.test(ua)) operating_system = "macOS";
  else if (/Android/i.test(ua)) operating_system = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) operating_system = "iOS";
  else if (/Linux/i.test(ua)) operating_system = "Linux";

  let device_type = "DESKTOP";
  if (/iPad|Tablet/i.test(ua)) device_type = "TABLET";
  else if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) device_type = "MOBILE";
  else if (/Laptop|Windows NT|Macintosh/i.test(ua)) device_type = "LAPTOP";

  const device_name =
    device_type === "MOBILE"
      ? `${operating_system} Phone`
      : device_type === "TABLET"
      ? `${operating_system} Tablet`
      : device_type === "LAPTOP"
      ? `${operating_system} Laptop`
      : `${operating_system} Desktop`;

  return { browser, operating_system, device_type, device_name };
};

const normalizeDeviceData = (deviceData = {}, userAgent = "") => {
  const parsed = parseUserAgent(userAgent);

  return {
    device_id: String(deviceData.device_id || "").trim(),
    device_name: String(deviceData.device_name || parsed.device_name).trim().slice(0, 150),
    device_type: ["DESKTOP", "LAPTOP", "MOBILE", "TABLET"].includes(deviceData.device_type)
      ? deviceData.device_type
      : parsed.device_type,
    browser: String(deviceData.browser || parsed.browser).trim().slice(0, 100),
    operating_system: String(
      deviceData.operating_system || parsed.operating_system
    ).trim().slice(0, 100),
  };
};

const handleStudentDeviceLogin = async (user, deviceData, ipAddress, userAgent) => {
  const normalized = normalizeDeviceData(deviceData, userAgent);

  if (!normalized.device_id) {
    const error = new Error("Device identifier is required for login.");
    error.status = 400;
    throw error;
  }

  const now = new Date();

  return sequelize.transaction(async (transaction) => {
    // Lock the user row so concurrent new-device logins cannot both observe
    // fewer than two active devices and bypass the limit.
    const lockedUser = await User.findByPk(user.id, {
      attributes: ["id", "role_id"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!lockedUser) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const existingDevice = await UserDevice.findOne({
      where: {
        user_id: user.id,
        device_id: normalized.device_id,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingDevice && existingDevice.status === "ACTIVE") {
      await existingDevice.update(
        {
          last_login_at: now,
          last_active_at: now,
          last_ip_address: ipAddress || null,
          device_name: normalized.device_name,
          device_type: normalized.device_type,
          browser: normalized.browser,
          operating_system: normalized.operating_system,
        },
        { transaction }
      );

      return existingDevice;
    }

    // Only STUDENT accounts are blocked at two active devices. Other roles
    // are tracked for auditing but are never blocked by the device limit.
    if (Number(lockedUser.role_id) === 3) {
      const activeCount = await UserDevice.count({
        where: {
          user_id: user.id,
          status: "ACTIVE",
        },
        transaction,
      });

      if (activeCount >= MAX_STUDENT_DEVICES) {
        const error = new Error(DEVICE_LIMIT_MESSAGE);
        error.status = 403;
        error.code = "DEVICE_LIMIT_REACHED";
        throw error;
      }
    }

    const values = {
      user_id: user.id,
      device_id: normalized.device_id,
      device_name: normalized.device_name,
      device_type: normalized.device_type,
      browser: normalized.browser,
      operating_system: normalized.operating_system,
      last_ip_address: ipAddress || null,
      last_login_at: now,
      last_active_at: now,
      status: "ACTIVE",
    };

    if (existingDevice) {
      await existingDevice.update(values, { transaction });
      return existingDevice;
    }

    return UserDevice.create(values, { transaction });
  });
};

const getUserDevices = async (userId) => {
  return UserDevice.findAll({
    where: { user_id: userId },
    order: [
      ["status", "ASC"],
      ["last_active_at", "DESC"],
      ["created_at", "DESC"],
    ],
  });
};

const revokeUserDevice = async (userId, deviceId) => {
  const device = await UserDevice.findOne({
    where: {
      id: deviceId,
      user_id: userId,
    },
  });

  if (!device) {
    const error = new Error("Device not found for this user");
    error.status = 404;
    throw error;
  }

  if (device.status === "REVOKED") {
    return device;
  }

  await device.update({ status: "REVOKED" });
  return device;
};

module.exports = {
  DEVICE_LIMIT_MESSAGE,
  parseUserAgent,
  normalizeDeviceData,
  handleStudentDeviceLogin,
  getUserDevices,
  revokeUserDevice,
};
