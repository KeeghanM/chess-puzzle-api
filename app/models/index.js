const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize({
    dialect: dbConfig.dialect,
    username: dbConfig.username,
    password: dbConfig.password,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    dialectOptions: dbConfig.dialectOptions,
    logging: dbConfig.logging,
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.puzzles = require("./puzzle.model.js")(sequelize, Sequelize);

module.exports = db;