const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseStudent = sequelize.define(
  "CourseStudent",
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

    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    enrollment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "COMPLETED", "DROPPED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    completion_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    tableName: "batch_students",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = CourseStudent;