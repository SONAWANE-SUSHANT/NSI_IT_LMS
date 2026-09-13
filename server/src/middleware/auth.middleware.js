const { verifyToken } = require("../utils/jwt");
const { User } = require("../models");

// Short-lived status cache (30 seconds) to avoid database load while instantly respecting suspensions
const userStatusCache = new Map();
const CACHE_TTL_MS = 30 * 1000;

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    // Validate that the user exists and is actively allowed to access the system
    const now = Date.now();
    const cachedUser = userStatusCache.get(decoded.id);

    let userStatus = cachedUser?.expiresAt > now ? cachedUser.status : null;

    if (!userStatus) {
      const dbUser = await User.findByPk(decoded.id, {
        attributes: ["id", "status", "role_id"],
      });

      if (!dbUser) {
        return res.status(401).json({
          success: false,
          message: "User account no longer exists",
        });
      }

      userStatus = dbUser.status;

      if (userStatusCache.size > 5000) {
        userStatusCache.clear();
      }
      userStatusCache.set(decoded.id, { status: userStatus, expiresAt: now + CACHE_TTL_MS });
    }

    if (userStatus !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        message: "User account is suspended or inactive",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

module.exports = authenticate;