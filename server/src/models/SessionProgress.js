const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SessionProgress = sequelize.define(
  "SessionProgress",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    session_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
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
    tableName: "session_progress",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["session_id", "student_id"],
        name: "uk_session_student_progress",
      },
      {
        fields: ["student_id"],
        name: "idx_session_progress_student",
      },
    ],
  }
);

module.exports = SessionProgress;
