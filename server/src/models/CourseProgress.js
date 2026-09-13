const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseProgress = sequelize.define(
  "CourseProgress",
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

    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    completion_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
    },

    completed_sessions: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    total_sessions: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "course_progress",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["course_id", "student_id"],
        name: "uk_course_student_progress",
      },
      {
        fields: ["student_id"],
        name: "idx_course_progress_student",
      },
    ],
  }
);

module.exports = CourseProgress;
