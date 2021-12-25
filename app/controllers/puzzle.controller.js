const { sequelize } = require("../models");
const {QueryTypes} = require('sequelize');
const db = require("../models");
const Puzzle = db.puzzles;
const Op = db.Sequelize.Op;

// Get one puzzle by ID
exports.getOne = (req,res) => {
  const id = req.params.id;
  Puzzle.findByPk(id)
  .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Puzzle with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Puzzle with id=" + id
      });
    });    
}

// Get one random puzzle
exports.getRandom = async (req,res) => {
  var randRating = Math.floor(Math.random() * (3001 - 511 + 1) + 511);
  var variation = 1;

  const puzzle = await sequelize.query(
      "SELECT puzzleid,fen,rating,ratingdeviation,moves,themes FROM puzzles WHERE rating >= "+(randRating-variation)+" AND rating <= "+(randRating+variation)+" ORDER BY RANDOM() LIMIT 1",
      {
        type: QueryTypes.SELECT,
        model: Puzzle,
        mapToModel: true
      });

  res.send({puzzle})
}

// 