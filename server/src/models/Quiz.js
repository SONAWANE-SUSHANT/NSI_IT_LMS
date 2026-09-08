const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Quiz = sequelize.define(
  "Quiz",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    session_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    total_marks: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    passing_marks: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },

    max_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    status: {
      type: DataTypes.ENUM("DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"),
      allowNull: false,
      defaultValue: "DRAFT",
    },

    available_from: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    available_until: {
      type: DataTypes.DATE,
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
    tableName: "quizzes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Quiz;
