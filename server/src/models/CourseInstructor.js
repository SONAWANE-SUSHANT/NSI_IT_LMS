const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseInstructor = sequelize.define(
  "CourseInstructor",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    batch_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    instructor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    assigned_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    tableName: "batch_instructors",
    timestamps: true,
    createdAt: false, // assigned_at is used
    updatedAt: "updated_at",
  }
);

module.exports = CourseInstructor;