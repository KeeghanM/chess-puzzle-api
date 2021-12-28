// TO DO:
//  - Change theme array handling 


const { sequelize } = require("../models");
const {QueryTypes} = require('sequelize');
const db = require("../models");
const Puzzle = db.puzzles;

exports.mainAccess = async (req,res) => {
  if(req.headers["x-mashape-proxy-secret"] == undefined || req.headers["x-mashape-proxy-secret"] != process.env.RapidAPISecret) {
    res.status(400).send("Request must be sent via RapidAPI") 
    return
  }

  let puzzles 
  let queryString = "SELECT puzzleid,fen,rating,ratingdeviation,moves,themes FROM puzzles WHERE 1=1 "
  let secStr = ["/",";"]
  
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

    if(
      req.query.id.length > 6 || 
      secStr.some(x => req.query.id.includes(x))
    ) {
      // Validate ID for Security
      res.status(400).send("Invalid ID Sent")
      return
    } 

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
  // RATING
  // PLAYERMOVES
  else {
    if(
      (req.query.rating && parseInt(req.query.rating) == "NaN") ||
      (req.query.playerMoves && parseInt(req.query.playerMoves) == "NaN") ||
      (req.query.count && parseInt(req.query.count) == "NaN") ||
      (req.query.themes && secStr.some(x => req.query.themes.includes(x))) ||
      (req.query.themesType && secStr.some(x => req.query.themesType.includes(x)))
    ) {
      res.status(400).send("Invalid Query String")
      return
    }

    // Number of moves in the puzzle
    // specified by moves the PLAYER makes
    if(req.query.playerMoves){
      queryString += "AND array_length(moves,1) = " +(parseInt(req.query.playerMoves)*2) + " "
    }

    if(req.query.themes) {
      queryString += "AND ("

      // First extract the themes from the query string
      let themes
      try {
        themes = JSON.parse(req.query.themes)
      }
      catch{
        res.status(400).send("Invalid Themes Array")
      }

      // If multiple themes are specified, they also need to specify a type
      if(themes.length > 1 && !req.query.themesType) {
        res.status(400).send("themesType needed when multiple themes supplied")
        return
      }

      // Now loop through the themes and attach them
      for(let theme of themes){
        queryString += " '" +theme+ "'=ANY(themes)"
        queryString += req.query.themesType == "OR" ? " OR" : " AND" // the type sets whether we use AND or OR selectors for the theme
      }
      queryString = queryString.substring(0, queryString.lastIndexOf(" "));
      queryString += ") "
    }
      
    // We always want to attach a rating (to make the query faster) and a limit
    // If the user hasn't supplied a rating, we will generate one for them
    let limit = req.query.count ? req.query.count : 1
    let rating = req.query.rating ? req.query.rating : Math.floor(Math.random() * (3001 - 511 + 1) + 511);
    queryString += "AND rating BETWEEN " + (parseInt(rating)) + "-ratingdeviation AND " + (parseInt(rating)) + "+ratingdeviation ORDER BY RANDOM() LIMIT "+limit

    try {
    puzzles = await sequelize.query(
      queryString,
      {
        type: QueryTypes.SELECT,
        model: Puzzle,
        mapToModel: true
      });
    }
    catch {
      res.status(500).send("Error fetching puzzles. Please contact the admin.")
      return
    }

  }

  if(puzzles.length == 0){
    res.status(400).send("No Matching Puzzles")
    return
  }
  res.status(200).send({
    puzzles
  })
}