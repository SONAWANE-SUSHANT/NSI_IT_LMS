const fs = require("fs");
const path = require("path");
const { User, UserRole } = require("../models");

/**
 * Format user entity into safe public profile object (never exposes password)
 */
const formatProfileResponse = (user) => {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    email: user.email,
    photo: user.photo,
    contact_no: user.contact_no,
    date_of_birth: user.date_of_birth,
    gender: user.gender,
    role_id: user.role_id,
    role: user.role ? user.role.name : undefined,
    status: user.status,
  };
};

/**
 * Get profile for authenticated user
 */
const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: UserRole, as: "role", attributes: ["id", "name"] }],
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return formatProfileResponse(user);
};

/**
 * Update authenticated user's own profile
 */
const updateProfile = async (userId, payload) => {
  const user = await User.findByPk(userId, {
    include: [{ model: UserRole, as: "role", attributes: ["id", "name"] }],
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const {
    first_name,
    last_name,
    contact_no,
    date_of_birth,
    gender,
    photo,
  } = payload;

  // 1. Validate First Name
  if (first_name !== undefined) {
    if (typeof first_name !== "string" || !first_name.trim()) {
      const error = new Error("First name is required and cannot be empty");
      error.status = 400;
      throw error;
    }
    const trimmedFirst = first_name.trim();
    if (trimmedFirst.length > 100) {
      const error = new Error("First name cannot exceed 100 characters");
      error.status = 400;
      throw error;
    }
    user.first_name = trimmedFirst;
  }

  // 2. Validate Last Name
  if (last_name !== undefined) {
    if (typeof last_name !== "string" || !last_name.trim()) {
      const error = new Error("Last name is required and cannot be empty");
      error.status = 400;
      throw error;
    }
    const trimmedLast = last_name.trim();
    if (trimmedLast.length > 100) {
      const error = new Error("Last name cannot exceed 100 characters");
      error.status = 400;
      throw error;
    }
    user.last_name = trimmedLast;
  }

  // 3. Validate Contact Number
  if (contact_no !== undefined && contact_no !== null) {
    const trimmedContact = String(contact_no).trim();
    if (trimmedContact.length > 20) {
      const error = new Error("Contact number cannot exceed 20 characters");
      error.status = 400;
      throw error;
    }
    user.contact_no = trimmedContact;
  }

  // 4. Validate Date of Birth
  if (date_of_birth !== undefined && date_of_birth !== null && date_of_birth !== "") {
    const parsedDate = new Date(date_of_birth);
    if (isNaN(parsedDate.getTime()) || typeof date_of_birth !== "string") {
      const error = new Error("Invalid date of birth format");
      error.status = 400;
      throw error;
    }
    // Extract YYYY-MM-DD
    const isoDate = parsedDate.toISOString().split("T")[0];
    user.date_of_birth = isoDate;
  } else if (date_of_birth === null || date_of_birth === "") {
    user.date_of_birth = null;
  }

  // 5. Validate Gender
  if (gender !== undefined && gender !== null) {
    const validGenders = ["MALE", "FEMALE", "OTHER"];
    const normalizedGender = String(gender).toUpperCase().trim();
    if (!validGenders.includes(normalizedGender)) {
      const error = new Error("Gender must be one of MALE, FEMALE, or OTHER");
      error.status = 400;
      throw error;
    }
    user.gender = normalizedGender;
  }

  // 6. Validate Photo (if provided directly as URL or path)
  if (photo !== undefined) {
    if (photo === null || photo === "") {
      user.photo = null;
    } else if (typeof photo === "string") {
      const trimmedPhoto = photo.trim();
      if (trimmedPhoto.length > 500) {
        const error = new Error("Photo URL cannot exceed 500 characters");
        error.status = 400;
        throw error;
      }
      user.photo = trimmedPhoto;
    }
  }

  // Explicitly protect immutable fields:
  // id, role_id, status, username, password, email, created_by CANNOT be altered
  user.updated_by = userId;

  await user.save();
  await user.reload();

  return formatProfileResponse(user);
};

/**
 * Upload profile photo for authenticated user
 */
const uploadPhoto = async (userId, payload) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const { photo_url, image } = payload || {};

  // If a URL was provided
  if (photo_url && typeof photo_url === "string") {
    const trimmed = photo_url.trim();
    if (trimmed.length > 500) {
      const error = new Error("Photo URL cannot exceed 500 characters");
      error.status = 400;
      throw error;
    }
    user.photo = trimmed;
    user.updated_by = userId;
    await user.save();
    return { photo: user.photo };
  }

  // If base64 image was provided
  if (image && typeof image === "string") {
    let mimeType = "";
    let base64Data = image;

    // Parse data URL prefix: data:<mime-type>;base64,<data>
    const matches = image.match(/^data:([a-zA-Z0-9\-\.\+]+(?:\/[a-zA-Z0-9\-\.\+]+)?);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1].toLowerCase();
      base64Data = matches[2];
    } else if (image.startsWith("data:")) {
      const error = new Error("Unsupported image format. Allowed formats are JPEG, PNG, WEBP");
      error.status = 400;
      throw error;
    } else {
      mimeType = "image/jpeg";
    }

    const allowedMimeTypes = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const ext = allowedMimeTypes[mimeType];
    if (!ext) {
      const error = new Error("Unsupported image format. Allowed formats are JPEG, PNG, WEBP");
      error.status = 400;
      throw error;
    }

    const buffer = Buffer.from(base64Data, "base64");
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    if (buffer.length > MAX_SIZE) {
      const error = new Error("Image file size exceeds maximum limit of 2MB");
      error.status = 400;
      throw error;
    }

    // Ensure uploads directory exists
    const uploadsDir = path.resolve(__dirname, "../../uploads/avatars");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `avatar-${userId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/avatars/${filename}`;
    user.photo = relativeUrl;
    user.updated_by = userId;
    await user.save();

    return { photo: user.photo };
  }

  const error = new Error("Please provide a valid image file or photo URL");
  error.status = 400;
  throw error;
};

module.exports = {
  getProfile,
  updateProfile,
  uploadPhoto,
  formatProfileResponse,
};
