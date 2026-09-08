const jwt = require("jsonwebtoken");

const tokenCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role_id: user.role_id,
      role: user.role ? user.role.name : undefined,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

const verifyToken = (token) => {
  const now = Date.now();
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > now) {
    return cached.decoded;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (tokenCache.size > 5000) {
    tokenCache.clear();
  }
  tokenCache.set(token, { decoded, expiresAt: now + CACHE_TTL_MS });

  return decoded;
};

module.exports = {
  generateToken,
  verifyToken,
};