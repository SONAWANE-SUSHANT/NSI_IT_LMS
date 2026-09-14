const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 30,             // Maximum number of connection in pool
      min: 5,              // Minimum number of connection in pool
      acquire: 30000,      // The maximum time (ms) that pool will try to get connection before throwing error
      idle: 10000,         // The maximum time (ms) that a connection can be idle before being released
      evict: 1000,         // The time interval (ms) after which sequelize-pool will remove idle connections
    },
    dialectOptions: {
      decimalNumbers: true,
      supportBigNumbers: true,
      connectTimeout: 10000,
      ...(process.env.DB_SSL === "REQUIRED" ||
      process.env.DB_SSL === "true" ||
      (process.env.DB_HOST && process.env.DB_HOST.includes("aivencloud.com"))
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {}),
    },
    // Keep connection alive and recycle stale connections
    retry: {
      max: 3,
    },
  }
);

module.exports = sequelize;