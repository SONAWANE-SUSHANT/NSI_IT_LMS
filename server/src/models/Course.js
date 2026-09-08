const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Course = sequelize.define(
  "Course",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },

    // Getter alias for backward-compatibility
    course_code: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("code");
      },
      set(val) {
        if (val) this.setDataValue("code", val);
      },
    },

    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    thumbnail_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    duration: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"),
      allowNull: false,
      defaultValue: "DRAFT",
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
    tableName: "courses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Course.prototype.toJSON = function () {
  const values = { ...this.get() };
  values.course_code = values.code;
  return values;
};

module.exports = Course;