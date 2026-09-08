const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const QuizOption = sequelize.define(
  "QuizOption",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    question_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    option_label: {
      type: DataTypes.CHAR(1),
      allowNull: false,
    },

    option_text: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },

    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    tableName: "quiz_options",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = QuizOption;
