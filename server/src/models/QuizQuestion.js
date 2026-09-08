const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const QuizQuestion = sequelize.define(
  "QuizQuestion",
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

    question_type: {
      type: DataTypes.ENUM("MCQ", "CODING"),
      allowNull: false,
    },

    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    marks: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 1.0,
    },

    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    difficulty: {
      type: DataTypes.ENUM("EASY", "MEDIUM", "HARD"),
      allowNull: false,
      defaultValue: "MEDIUM",
    },

    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    programming_language: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    starter_code: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    constraints: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    expected_output: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
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
    tableName: "quiz_questions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = QuizQuestion;
