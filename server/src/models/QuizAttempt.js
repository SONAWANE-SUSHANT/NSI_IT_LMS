const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const QuizAttempt = sequelize.define(
  "QuizAttempt",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    quiz_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    attempt_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    status: {
      type: DataTypes.ENUM(
        "IN_PROGRESS",
        "SUBMITTED",
        "AUTO_SUBMITTED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "IN_PROGRESS",
    },

    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    score: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    total_marks: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    passed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "quiz_attempts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = QuizAttempt;
