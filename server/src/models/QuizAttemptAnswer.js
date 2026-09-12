const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const QuizAttemptAnswer = sequelize.define(
  "QuizAttemptAnswer",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    attempt_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    question_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    selected_option_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    answer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    code_submission: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    },

    marks_awarded: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    answered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "quiz_attempt_answers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = QuizAttemptAnswer;
