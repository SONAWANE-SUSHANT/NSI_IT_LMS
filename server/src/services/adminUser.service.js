const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { User, UserRole } = require("../models");
const { hashPassword } = require("../utils/password");

const STUDENT_ROLE_ID = 3;
const REQUIRED_IMPORT_FIELDS = ["first_name", "last_name", "email", "password"];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeImportRow = (row) => ({
  first_name: String(row.first_name || "").trim(),
  last_name: String(row.last_name || "").trim(),
  email: String(row.email || "").trim().toLowerCase(),
  contact_no: String(row.contact_no || "0000000000").trim(),
  gender: ["MALE", "FEMALE", "OTHER"].includes(String(row.gender || "").toUpperCase())
    ? String(row.gender).toUpperCase()
    : "OTHER",
  password: String(row.password || ""),
});

const validateStudentImportRows = async (rows) => {
  const errors = [];
  const normalizedRows = [];
  const seenEmails = new Map();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const normalized = normalizeImportRow(row || {});
    const rowErrors = [];

    REQUIRED_IMPORT_FIELDS.forEach((field) => {
      if (!normalized[field]) rowErrors.push(`${field} is required`);
    });

    if (normalized.email && !isValidEmail(normalized.email)) {
      rowErrors.push("Email is invalid");
    }

    if (normalized.password && normalized.password.length < 6) {
      rowErrors.push("Password must be at least 6 characters");
    }

    if (normalized.email) {
      if (seenEmails.has(normalized.email)) {
        rowErrors.push(`Duplicate email in CSV (also row ${seenEmails.get(normalized.email)})`);
      } else {
        seenEmails.set(normalized.email, rowNumber);
      }
    }

    normalizedRows.push({ ...normalized, rowNumber });
    if (rowErrors.length) errors.push({ row: rowNumber, errors: rowErrors });
  });

  const emails = normalizedRows.map((row) => row.email).filter(Boolean);

  if (emails.length) {
    const existingUsers = await User.findAll({
      where: {
        email: { [Op.in]: emails },
      },
      attributes: ["email"],
    });

    existingUsers.forEach((user) => {
      normalizedRows.forEach((row) => {
        const rowErrors = [];
        if (user.email === row.email) rowErrors.push("Email already exists");
        if (rowErrors.length) errors.push({ row: row.rowNumber, errors: rowErrors });
      });
    });
  }

  const invalidRows = new Set(errors.map((error) => error.row));
  const validRows = normalizedRows.filter((row) => !invalidRows.has(row.rowNumber));

  return { validRows, errors };
};

const createUserByAdmin = async (userData, adminId) => {
  const {
    first_name,
    last_name,
    email,
    password,
    role_id,
    contact_no,
    gender,
    date_of_birth,
    photo,
    status,
  } = userData;

  const existingEmail = await User.findOne({
    where: {
      email,
    },
  });

  if (existingEmail) {
    throw new Error("Email already exists");
  }

  const role = await UserRole.findByPk(role_id);
  if (!role) {
    throw new Error("Invalid role");
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    first_name,
    last_name,
    email,
    password: hashedPassword,
    role_id,
    contact_no: contact_no || "0000000000",
    gender: gender || "OTHER",
    date_of_birth: date_of_birth || null,
    photo: photo || null,
    status: status || "ACTIVE",
    created_by: adminId,
    updated_by: adminId,
  });

  // Reload to get the generated username
  await user.reload();

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username,
    role_id: user.role_id,
    role: role.name,
    photo: user.photo,
    contact_no: user.contact_no,
    gender: user.gender,
    date_of_birth: user.date_of_birth,
    status: user.status,
    created_by: user.created_by,
    updated_by: user.updated_by,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

const getUsersByAdmin = async (filters = {}) => {
  const { role_id, status, search } = filters;
  const where = {};

  if (role_id) {
    where.role_id = role_id;
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { first_name: { [Op.like]: term } },
      { last_name: { [Op.like]: term } },
      { username: { [Op.like]: term } },
      { email: { [Op.like]: term } },
    ];
  }

  const users = await User.findAll({
    where,
    attributes: [
      "id",
      "first_name",
      "last_name",
      "email",
      "username",
      "role_id",
      "photo",
      "contact_no",
      "gender",
      "date_of_birth",
      "status",
      "created_by",
      "updated_by",
      "created_at",
      "updated_at",
    ],
    include: [
      {
        model: UserRole,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
    order: [["created_at", "DESC"]],
    raw: true,
    nest: true,
  });

  return users.map((user) => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username,
    role_id: user.role_id,
    role: user.role?.name || null,
    photo: user.photo,
    contact_no: user.contact_no,
    gender: user.gender,
    date_of_birth: user.date_of_birth,
    status: user.status,
    created_by: user.created_by,
    updated_by: user.updated_by,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }));
};

const getUserByIdByAdmin = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
    include: [
      {
        model: UserRole,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username,
    role_id: user.role_id,
    role: user.role?.name || null,
    photo: user.photo,
    contact_no: user.contact_no,
    gender: user.gender,
    date_of_birth: user.date_of_birth,
    status: user.status,
    created_by: user.created_by,
    updated_by: user.updated_by,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

const updateUserByAdmin = async (id, updateData, adminId) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error("User not found");
  }

  const {
    first_name,
    last_name,
    email,
    photo,
    contact_no,
    gender,
    date_of_birth,
    status,
    role_id,
    password,
  } = updateData;

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email, id: { [Op.ne]: id } } });
    if (existing) throw new Error("Email already exists");
  }

  if (role_id && role_id !== user.role_id) {
    const role = await UserRole.findByPk(role_id);
    if (!role) throw new Error("Invalid role");
    user.role_id = role_id;
  }

  if (first_name !== undefined) user.first_name = first_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (email !== undefined) user.email = email;
  if (photo !== undefined) user.photo = photo;
  if (contact_no !== undefined) user.contact_no = contact_no;
  if (gender !== undefined) user.gender = gender;
  if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
  if (status !== undefined) user.status = status;
  if (password) user.password = await hashPassword(password);

  user.updated_by = adminId;
  await user.save();
  await user.reload();

  const role = await UserRole.findByPk(user.role_id);

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username,
    role_id: user.role_id,
    role: role?.name || null,
    photo: user.photo,
    contact_no: user.contact_no,
    gender: user.gender,
    date_of_birth: user.date_of_birth,
    status: user.status,
    created_by: user.created_by,
    updated_by: user.updated_by,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

const updateUserStatusByAdmin = async (id, status, adminId) => {
  const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status. Allowed values: ACTIVE, INACTIVE, SUSPENDED");
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw new Error("User not found");
  }

  user.status = status;
  user.updated_by = adminId;
  await user.save();

  const role = await UserRole.findByPk(user.role_id);

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username,
    role_id: user.role_id,
    role: role?.name || null,
    status: user.status,
    updated_by: user.updated_by,
    updated_at: user.updated_at,
  };
};

const importStudentsByAdmin = async (rows, adminId) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("At least one student row is required");
  }

  const role = await UserRole.findByPk(STUDENT_ROLE_ID);
  if (!role || role.name !== "STUDENT") {
    throw new Error("Student role is not configured");
  }

  const { validRows, errors } = await validateStudentImportRows(rows);
  const summary = {
    totalRows: rows.length,
    validRows: validRows.length,
    invalidRows: rows.length - validRows.length,
    successfullyImported: 0,
    failed: rows.length - validRows.length,
    errors,
  };

  if (validRows.length === 0) {
    return summary;
  }

  const transaction = await sequelize.transaction();

  try {
    const usersToCreate = await Promise.all(
      validRows.map(async (row) => ({
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        contact_no: row.contact_no || "0000000000",
        gender: row.gender || "OTHER",
        password: await hashPassword(row.password),
        role_id: STUDENT_ROLE_ID,
        status: "ACTIVE",
        created_by: adminId,
        updated_by: adminId,
      }))
    );

    await User.bulkCreate(usersToCreate, { transaction });
    await transaction.commit();

    summary.successfullyImported = usersToCreate.length;
    return summary;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createUserByAdmin,
  getUsersByAdmin,
  getUserByIdByAdmin,
  updateUserByAdmin,
  updateUserStatusByAdmin,
  importStudentsByAdmin,
};
