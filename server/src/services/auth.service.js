const { Op } = require("sequelize");
const { User, UserRole } = require("../models");
const { comparePassword } = require("../utils/password");

const loginUser = async (username, password) => {
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { username: username },
        { email: username },
      ],
    },
    include: [
      {
        model: UserRole,
        as: "role",
        attributes: ["id", "name"],
      },
    ],
  });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is not active");
  }

  const validPassword = await comparePassword(
    password,
    user.password
  );

  if (!validPassword) {
    throw new Error("Invalid username or password");
  }

  return user;
};

module.exports = {
  loginUser,
};