const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize({
    dialect: 'postgres',
    username: process.env.PUZZLE_DB_USERNAME,
    password: process.env.PUZZLE_DB_PWORD,
    host: process.env.PUZZLE_DB_HOST,
    port: process.env.PUZZLE_DB_PORT,
    database: process.env.PUZZLE_DB_DB,
    logging: false,
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.puzzles = require("./puzzle.model.js")(sequelize, Sequelize);

module.exports = db;