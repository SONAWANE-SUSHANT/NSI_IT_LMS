const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserDevice = sequelize.define(
  "UserDevice",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    device_name: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    device_type: {
      type: DataTypes.ENUM("DESKTOP", "LAPTOP", "MOBILE", "TABLET"),
      allowNull: true,
    },
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    operating_system: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_active_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "REVOKED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "user_devices",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = UserDevice;
