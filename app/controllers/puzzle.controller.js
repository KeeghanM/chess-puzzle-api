const oracledb = require("oracledb")

exports.mainAccess = async (req, res) => {
  if (
    process.env.NODE_ENV === "production" &&
    (req.headers["x-mashape-proxy-secret"] == undefined ||
      req.headers["x-mashape-proxy-secret"] != process.env.RapidAPISecret)
  ) {
    res.status(400).send("Request must be sent via RapidAPI")
    return
  }

  let queryString =
    "SELECT puzzleid,fen,rating,ratingdeviation,moves,themes FROM puzzles WHERE 1=1 "
  let secStr = ["/", ";"]

  // First check if no query string present
  // if this is the case, return a single random puzzle
  if (Object.keys(req.query).length === 0) {
    var randRating = Math.floor(Math.random() * (3001 - 511 + 1) + 511)
    queryString +=
      "AND rating BETWEEN " +
      (randRating - 1) +
      " AND " +
      (randRating + 1) +
      " ORDER BY DBMS_RANDOM.VALUE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
  }

  // If an ID gets passed in, handle that as a priority
  else if (req.query.id) {
    if (
      req.query.id.length > 6 ||
      secStr.some((x) => req.query.id.includes(x))
    ) {
      // Validate ID for Security
      res.status(400).send("Invalid ID Sent")
      return
    }
    queryString +=
      "AND puzzleid = '" +
      req.query.id +
      "' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
  }

  // If no ID, then we need to handle
  // COUNT
  // THEMES
  // RATING
  // PLAYERMOVES
  else {
    if (
      invalidQueryString() ||
      (req.query.rating && parseInt(req.query.rating) == "NaN") ||
      (req.query.playerMoves && parseInt(req.query.playerMoves) == "NaN") ||
      (req.query.count && parseInt(req.query.count) == "NaN") ||
      (req.query.themes && secStr.some((x) => req.query.themes.includes(x))) ||
      (req.query.themesType &&
        secStr.some((x) => req.query.themesType.includes(x)))
    ) {
      res.status(400).send("Invalid Query String")
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
        res.status(400).send("Invalid Themes Array")
      }

      // If multiple themes are specified, they also need to specify a type
      if (themes.length > 1 && !req.query.themesType) {
        res.status(400).send("themesType needed when multiple themes supplied")
        return
      }

      // Now loop through the themes and attach them
      for (let theme of themes) {
        queryString += " " + theme
        queryString += req.query.themesType == "ALL" ? " AND" : " OR" // the type sets whether we use AND or OR selectors for the theme
      }
      queryString = queryString.substring(0, queryString.lastIndexOf(" "))
      queryString += "') > 0 "
    }

    // We always want to attach a rating (to make the query faster) and a limit
    // If the user hasn't supplied a rating, we will generate one for them
    let limit = req.query.count ? req.query.count : 1
    limit = limit > 500 ? 500 : limit

    let rating = req.query.rating
      ? req.query.rating
      : Math.floor(Math.random() * (3001 - 511 + 1) + 511)
    queryString +=
      " AND " +
      parseInt(rating) +
      " BETWEEN RATING - RATINGDEVIATION AND RATING + RATINGDEVIATION "
    queryString +=
      " ORDER BY DBMS_RANDOM.VALUE OFFSET 0 ROWS FETCH NEXT " +
      limit +
      " ROWS ONLY"
  }

  let connection
  try {
    const connectionOptions = {
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      connectionString: process.env.DB_CONNECTION_STRING,
    }
    connection = await oracledb.getConnection(connectionOptions)

    const result = await connection.execute(queryString)

    if (result.rows.length == 0) {
      res.status(400).send("No Matching Puzzles")
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
    res.status(500).send("Error fetching puzzles. Please contact the admin.")
    return
  } finally {
    if (connection) {
      try {
        await connection.close()
      } catch (err) {
        console.error(err)
        res
          .status(500)
          .send("Error fetching puzzles. Please contact the admin.")
        return
      }
    }
  }
}

function invalidQueryString() {
  return false
}
