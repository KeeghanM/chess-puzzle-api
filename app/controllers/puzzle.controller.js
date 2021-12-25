const { sequelize } = require("../models");
const {QueryTypes} = require('sequelize');
const db = require("../models");
const Puzzle = db.puzzles;
const Op = db.Sequelize.Op;

exports.mainAccess = async (req,res) => {
  let puzzles 
  let queryString = "SELECT puzzleid,fen,rating,ratingdeviation,moves,themes FROM puzzles WHERE 1=1 "

  // First check if no query string present
  // if this is the case, return a single random puzzle
  if(Object.keys(req.query).length === 0){
    var randRating = Math.floor(Math.random() * (3001 - 511 + 1) + 511);
    puzzles = await sequelize.query(
      queryString + "AND rating BETWEEN "+(randRating-1)+" AND "+(randRating+1)+" ORDER BY RANDOM() LIMIT 1",
      {
        type: QueryTypes.SELECT,
        model: Puzzle,
        mapToModel: true
      });
  }
  // If an ID gets passed in, handle that as a priority
  else if(req.query.id){
    puzzles = await sequelize.query(
      queryString + "AND puzzleid = '" + req.query.id + "' LIMIT 1",
      {
        type: QueryTypes.SELECT,
        model: Puzzle,
        mapToModel: true
      });
  }
  // If no ID, then we need to handle
  // COUNT
  // THEMES
  // and RATING
  else {
    let limit = req.query.count ? req.query.count : 1

    if(req.query.rating) {
      queryString += "AND rating BETWEEN " + (parseInt(req.query.rating)) + "-ratingdeviation AND " + (parseInt(req.query.rating)) + "+ratingdeviation "
    }

    // If themes are specified, they also need to specify a type
    if(req.query.themes && req.query.themesType) {

      queryString += "AND ("

      for(let theme of req.query.themes){
        queryString += " '" +theme+ "'=ANY(themes)"
        queryString += req.query.themesType == "OR" ? " OR" : " AND" // the type sets whether we use AND or OR selectors for the theme
      }
      queryString = queryString.substring(0, queryString.lastIndexOf(" "));
      queryString += ") "
    }

    queryString += " ORDER BY RANDOM() LIMIT "+limit

    puzzles = await sequelize.query(
      queryString,
      {
        type: QueryTypes.SELECT,
        model: Puzzle,
        mapToModel: true
      });

  }
    
  res.send({puzzles})
}

// 