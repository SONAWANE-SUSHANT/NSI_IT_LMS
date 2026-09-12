const { UserDevice } = require("../models");
const crypto = require("crypto");

/**
 * Parses user agent & request payload into clean device details
 */
const parseDeviceInfo = (req) => {
  const body = req.body || {};
  const userAgent = req.headers["user-agent"] || "";

  // 1. Device ID
  const device_id =
    body.device_id ||
    req.headers["x-device-id"] ||
    crypto.createHash("sha256").update(userAgent + (req.ip || "")).digest("hex").slice(0, 32);

  // 2. Client-provided or UA parsed OS
  let operating_system = body.operating_system;
  if (!operating_system) {
    if (/windows nt 10/i.test(userAgent)) operating_system = "Windows 11 / 10";
    else if (/windows/i.test(userAgent)) operating_system = "Windows";
    else if (/macintosh|mac os x/i.test(userAgent)) operating_system = "macOS";
    else if (/android/i.test(userAgent)) operating_system = "Android";
    else if (/iphone|ipad|ipod/i.test(userAgent)) operating_system = "iOS";
    else if (/linux/i.test(userAgent)) operating_system = "Linux";
    else operating_system = "Unknown OS";
  }

  // 3. Client-provided or UA parsed Browser
  let browser = body.browser;
  if (!browser) {
    if (/edg/i.test(userAgent)) browser = "Microsoft Edge";
    else if (/chrome|crios/i.test(userAgent) && !/opr|opera/i.test(userAgent)) browser = "Chrome";
    else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "Safari";
    else if (/opr|opera/i.test(userAgent)) browser = "Opera";
    else browser = "Browser";
  }

  // 4. Client-provided or UA parsed Device Type
  let device_type = (body.device_type || "").toUpperCase();
  if (!["DESKTOP", "LAPTOP", "MOBILE", "TABLET"].includes(device_type)) {
    if (/tablet|ipad/i.test(userAgent)) device_type = "TABLET";
    else if (/mobile|iphone|android/i.test(userAgent)) device_type = "MOBILE";
    else device_type = "LAPTOP"; // Default PC / Laptop
  }

  // 5. Client-provided or inferred Device Name
  let device_name = body.device_name;
  if (!device_name) {
    if (device_type === "MOBILE") {
      device_name = /iphone/i.test(userAgent) ? "Apple iPhone" : "Android Smartphone";
    } else if (device_type === "TABLET") {
      device_name = /ipad/i.test(userAgent) ? "Apple iPad" : "Android Tablet";
    } else if (/mac/i.test(operating_system)) {
      device_name = "MacBook / macOS Device";
    } else {
      device_name = `${operating_system} Laptop / PC`;
    }
  }

  // 6. IP Address
  const rawIp =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "127.0.0.1";
  const last_ip_address = rawIp.replace(/^::ffff:/, ""); // clean IPv4-mapped IPv6

  return {
    device_id,
    device_name: device_name.slice(0, 150),
    device_type,
    browser: browser.slice(0, 100),
    operating_system: operating_system.slice(0, 100),
    last_ip_address: last_ip_address.slice(0, 45),
  };
};

/**
 * Handles device registration and enforces strict 2-device limit for student logins
 */
const handleStudentDeviceLogin = async (user, req) => {
  const isStudent =
    (user.role && (user.role.name === "STUDENT" || user.role === "STUDENT")) ||
    user.role_id === 3;

  const deviceInfo = parseDeviceInfo(req);

  // If not a student (e.g. Admin or Instructor), we track the device without blocking
  if (!isStudent) {
    const [dev] = await UserDevice.findOrCreate({
      where: { user_id: user.id, device_id: deviceInfo.device_id },
      defaults: {
        ...deviceInfo,
        user_id: user.id,
        status: "ACTIVE",
        last_login_at: new Date(),
        last_active_at: new Date(),
      },
    });
    dev.last_login_at = new Date();
    dev.last_active_at = new Date();
    dev.last_ip_address = deviceInfo.last_ip_address;
    await dev.save();
    return { success: true, device: dev };
  }

  // Student Account: Check existing device
  const existingDevice = await UserDevice.findOne({
    where: {
      user_id: user.id,
      device_id: deviceInfo.device_id,
    },
  });

  if (existingDevice && existingDevice.status === "ACTIVE") {
    // Known active device -> Allow login and update activity timestamp
    existingDevice.last_login_at = new Date();
    existingDevice.last_active_at = new Date();
    existingDevice.last_ip_address = deviceInfo.last_ip_address;
    existingDevice.browser = deviceInfo.browser;
    existingDevice.operating_system = deviceInfo.operating_system;
    if (deviceInfo.device_name) existingDevice.device_name = deviceInfo.device_name;
    await existingDevice.save();
    return { success: true, device: existingDevice };
  }

  // New device OR previously revoked device: Check active device count
  const activeDeviceCount = await UserDevice.count({
    where: {
      user_id: user.id,
      status: "ACTIVE",
    },
  });

  // Business Rule: Each student account can have a maximum of 2 ACTIVE devices.
  if (activeDeviceCount >= 2) {
    const limitError = new Error(
      "Maximum device limit reached (2 active devices). Please contact an administrator to remove or revoke an existing device before logging in from a new device."
    );
    limitError.statusCode = 403;
    limitError.code = "DEVICE_LIMIT_EXCEEDED";
    throw limitError;
  }

  // Active count is < 2: Register / Reactivate device
  if (existingDevice) {
    existingDevice.status = "ACTIVE";
    existingDevice.device_name = deviceInfo.device_name;
    existingDevice.device_type = deviceInfo.device_type;
    existingDevice.browser = deviceInfo.browser;
    existingDevice.operating_system = deviceInfo.operating_system;
    existingDevice.last_ip_address = deviceInfo.last_ip_address;
    existingDevice.last_login_at = new Date();
    existingDevice.last_active_at = new Date();
    await existingDevice.save();
    return { success: true, device: existingDevice };
  }

  // Brand new device
  const newDevice = await UserDevice.create({
    user_id: user.id,
    device_id: deviceInfo.device_id,
    device_name: deviceInfo.device_name,
    device_type: deviceInfo.device_type,
    browser: deviceInfo.browser,
    operating_system: deviceInfo.operating_system,
    last_ip_address: deviceInfo.last_ip_address,
    status: "ACTIVE",
    last_login_at: new Date(),
    last_active_at: new Date(),
  });

  return { success: true, device: newDevice };
};

/**
 * List all devices for a given user
 */
const getUserDevices = async (userId) => {
  return await UserDevice.findAll({
    where: { user_id: userId },
    order: [
      ["status", "ASC"], // ACTIVE first, then REVOKED
      ["last_active_at", "DESC"],
      ["created_at", "DESC"],
    ],
  });
};

/**
 * Revoke or remove a device by admin
 */
const revokeUserDevice = async (userId, deviceId) => {
  const device = await UserDevice.findOne({
    where: {
      id: deviceId,
      user_id: userId,
    },
  });

  if (!device) {
    throw new Error("Device not found");
  }

  device.status = "REVOKED";
  await device.save();
  return device;
};

/**
 * Hard delete a device by admin
 */
const deleteUserDevice = async (userId, deviceId) => {
  const device = await UserDevice.findOne({
    where: {
      id: deviceId,
      user_id: userId,
    },
  });

  if (!device) {
    throw new Error("Device not found");
  }

  await device.destroy();
  return { success: true, message: "Device removed successfully" };
};

module.exports = {
  parseDeviceInfo,
  handleStudentDeviceLogin,
  getUserDevices,
  revokeUserDevice,
  deleteUserDevice,
};
