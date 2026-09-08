const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CourseModule = sequelize.define(
  "CourseModule",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    course_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    // Alias for backward compatibility
    title: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("name");
      },
      set(val) {
        if (val) this.setDataValue("name", val);
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    duration: {
      type: DataTypes.STRING(50),
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
    tableName: "course_modules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = CourseModule;