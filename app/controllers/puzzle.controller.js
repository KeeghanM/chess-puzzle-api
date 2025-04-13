const oracledb = require("oracledb")

const ErrorResponse = (message, status) => {
  return {
    message,
    status,
  }
}

exports.mainAccess = async (req, res) => {
  if (
    process.env.NODE_ENV === "production" &&
    (req.headers["x-mashape-proxy-secret"] == undefined ||
      req.headers["x-mashape-proxy-secret"] != process.env.RapidAPISecret)
  ) {
    res
      .status(400)
      .send(ErrorResponse("Request must be sent via RapidAPI", 400))
    return
  }
  const secStr = ["/", ";"]

  let queryString =
    "SELECT puzzleid,fen,rating,ratingdeviation,moves,themes FROM PUZZLES WHERE 1=1 "

  if (Object.keys(req.query).length === 0) {
    // First check if no query string present
    // if this is the case, return a single random puzzle
    const randRating = Math.floor(Math.random() * (3001 - 511 + 1) + 511)
    queryString +=
      "AND rating BETWEEN " +
      (randRating - 1) +
      " AND " +
      (randRating + 1) +
      " ORDER BY DBMS_RANDOM.VALUE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
  } else if (req.query.id) {
    // If an ID gets passed in, handle that as a priority
    if (
      req.query.id.length > 6 ||
      secStr.some((x) => req.query.id.includes(x))
    ) {
      // Validate ID for Security
      res.status(400).send(ErrorResponse("Invalid ID", 400))
      return
    }
    queryString +=
      "AND puzzleid = '" +
      req.query.id +
      "' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
  } else {
    // If no ID, then we need to handle
    // COUNT
    // THEMES
    // RATING
    // PLAYERMOVES
    if (
      (req.query.rating && parseInt(req.query.rating) == "NaN") ||
      (req.query.playerMoves && parseInt(req.query.playerMoves) == "NaN") ||
      (req.query.count && parseInt(req.query.count) == "NaN") ||
      (req.query.themes && secStr.some((x) => req.query.themes.includes(x))) ||
      (req.query.themesType &&
        secStr.some((x) => req.query.themesType.includes(x)))
    ) {
      res.status(400).send(ErrorResponse("Invalid Query", 400))
      return
    }

    // Number of moves in the puzzle
    // specified by moves the PLAYER makes
    if (req.query.playerMoves) {
      queryString +=
        " AND(LENGTH(MOVES) - LENGTH(replace(MOVES, ' ', '')) + 1) = " +
        parseInt(req.query.playerMoves) * 2
    }

    if (req.query.themes) {
      queryString += " AND CONTAINS(THEMES, '"
      // First extract the themes from the query string
      let themes
      try {
        themes = JSON.parse(req.query.themes)
      } catch {
        res.status(400).send(ErrorResponse("Invalid Themes", 400))
        return
      }

      // If multiple themes are specified, they also need to specify a type
      if (themes.length > 1 && !req.query.themesType) {
        res
          .status(400)
          .send(
            ErrorResponse(
              "themesType needed when multiple themes supplied",
              400
            )
          )
        return
      }

      // Now loop through the themes and attach them
      for (const theme of themes) {
        queryString += " " + theme
        queryString += req.query.themesType == "ALL" ? " AND" : " OR" // the type sets whether we use AND or OR selectors for the theme
      }
      queryString = queryString.substring(0, queryString.lastIndexOf(" "))
      queryString += "') > 0 "
    }

    // We always want to attach a rating (to make the query faster)
    // If the user hasn't supplied a rating, we will generate one for them
    const rating = req.query.rating
      ? req.query.rating
      : Math.floor(Math.random() * (3001 - 511 + 1) + 511)

    queryString +=
      " AND " +
      parseInt(rating) +
      " BETWEEN RATING - RATINGDEVIATION AND RATING + RATINGDEVIATION "

    // Finally, we need to attach the limit
    // If the user has supplied a count, we will use that capped at 500
    // If not, we will use the default of 1
    const limit = req.query.count ? Math.min(req.query.count, 500) : 1
    queryString +=
      " ORDER BY DBMS_RANDOM.VALUE OFFSET 0 ROWS FETCH NEXT " +
      limit +
      " ROWS ONLY"
  }

  try {
    const connection = await oracledb.getConnection({
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      connectionString: process.env.DB_CONNECTION_STRING,
    })
    const result = await connection.execute(queryString)

    if (result.rows.length == 0) {
      res.status(400).send(ErrorResponse("No Matching Puzzles", 400))
      return
    } else {
      let puzzles = []
      result.rows.forEach((pzl) => {
        puzzles.push({
          puzzleid: pzl[0],
          fen: pzl[1],
          rating: pzl[2],
          ratingdeviation: pzl[3],
          moves: pzl[4].split(" "),
          themes: pzl[5].split(" "),
        })
      })
      res.status(200).send({
        puzzles,
      })
    }
  } catch (err) {
    console.error(err)
    res
      .status(500)
      .send(
        ErrorResponse("Error fetching puzzles. Please contact the admin.", 500)
      )
    return
  }
}
