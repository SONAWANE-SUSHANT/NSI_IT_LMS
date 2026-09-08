const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LectureNote = sequelize.define(
  "LectureNote",
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

    // Backward-compatibility alias
    lecture_id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("session_id");
      },
      set(val) {
        if (val) this.setDataValue("session_id", val);
      },
    },

    title: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },

    note_type: {
      type: DataTypes.ENUM(
        "PDF",
        "PPT",
        "DOC",
        "EXCEL",
        "ZIP",
        "CODE",
        "LINK",
        "OTHER"
      ),
      allowNull: false,
      defaultValue: "PDF",
    },

    file_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    external_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },

    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "session_notes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = LectureNote;