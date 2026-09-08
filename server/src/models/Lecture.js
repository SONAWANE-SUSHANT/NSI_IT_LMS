const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Lecture = sequelize.define(
  "Lecture",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    module_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    instructor_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    title: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    session_type: {
      type: DataTypes.ENUM("RECORDED", "LIVE"),
      allowNull: false,
      defaultValue: "LIVE",
    },

    // Backward-compatibility alias
    lecture_type: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("session_type");
      },
      set(val) {
        if (val) this.setDataValue("session_type", val);
      },
    },

    status: {
      type: DataTypes.ENUM(
        "DRAFT",
        "SCHEDULED",
        "LIVE",
        "COMPLETED",
        "CANCELLED",
        "PUBLISHED"
      ),
      allowNull: false,
      defaultValue: "DRAFT",
    },

    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    duration_minutes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    session_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    // Backward-compatibility alias
    meet_url: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("session_url");
      },
      set(val) {
        if (val) this.setDataValue("session_url", val);
      },
    },

    recording_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    recording_provider: {
      type: DataTypes.ENUM("GOOGLE_DRIVE", "S3"),
      allowNull: true,
    },

    recording_status: {
      type: DataTypes.ENUM("NOT_AVAILABLE", "AVAILABLE"),
      allowNull: false,
      defaultValue: "NOT_AVAILABLE",
    },

    published_at: {
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
    tableName: "sessions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Lecture;