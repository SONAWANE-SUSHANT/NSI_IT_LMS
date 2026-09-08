const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseBatch = sequelize.define(
  "CourseBatch",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    batch_code: {
      type: DataTypes.STRING(100),
      // Generated stored column in MySQL
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    batch_mode: {
      type: DataTypes.ENUM("ONLINE", "OFFLINE", "HYBRID"),
      allowNull: false,
      defaultValue: "ONLINE",
    },

    batch_time: {
      type: DataTypes.ENUM("MORNING", "EVENING"),
      allowNull: false,
      defaultValue: "MORNING",
    },

    batch_schedule: {
      type: DataTypes.ENUM("WEEKDAYS", "WEEKENDS"),
      allowNull: false,
      defaultValue: "WEEKDAYS",
    },

    status: {
      type: DataTypes.ENUM("UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"),
      allowNull: false,
      defaultValue: "UPCOMING",
    },

    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: "batches",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = CourseBatch;