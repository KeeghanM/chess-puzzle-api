const oracledb = require('oracledb')
const ErrorResponse = require('./utils/errorResponse.js')

/**
 * Main access point for the puzzle API.
 * Handles various query parameters to fetch and return chess puzzles.
 */
exports.mainAccess = async (req, res) => {
  try {
    // RapidAPI authentication check for production environment
    if (
      process.env.NODE_ENV === 'production' &&
      (req.headers['x-mashape-proxy-secret'] == undefined ||
        req.headers['x-mashape-proxy-secret'] != process.env.RapidAPISecret)
    ) {
      res
        .status(401) // Changed to 401 for unauthorized access
        .json(
          ErrorResponse(
            'Unauthorized: Request must be sent via RapidAPI',
            401,
            'UNAUTHORIZED'
          )
        )
      return
    }

    let queryString =
      'SELECT puzzleid,fen,rating,ratingdeviation,moves,themes FROM puzzles WHERE 1=1 '
    let secStr = ['/', ';'] // Characters to check for in security validation

    // Handle different query scenarios
    if (Object.keys(req.query).length === 0) {
      // No query parameters: return a single random puzzle
      var randRating = Math.floor(Math.random() * (3001 - 511 + 1) + 511)
      queryString +=
        'AND rating BETWEEN ' +
        (randRating - 1) +
        ' AND ' +
        (randRating + 1) +
        ' ORDER BY DBMS_RANDOM.VALUE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY'
    } else if (req.query.id) {
      // Puzzle ID provided: fetch specific puzzle
      if (
        req.query.id.length > 6 ||
        secStr.some((x) => req.query.id.includes(x))
      ) {
        // Validate ID for security
        res
          .status(400)
          .json(ErrorResponse('Invalid puzzle ID', 400, 'INVALID_PUZZLE_ID'))
        return
      }
      queryString +=
        "AND puzzleid = '" +
        req.query.id +
        "' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY"
    } else {
      // Handle other query parameters: count, themes, rating, playerMoves
      if (
        (req.query.rating && isNaN(parseInt(req.query.rating))) ||
        (req.query.playerMoves && isNaN(parseInt(req.query.playerMoves))) ||
        (req.query.count && isNaN(parseInt(req.query.count))) ||
        (req.query.themes &&
          secStr.some((x) => req.query.themes.includes(x))) ||
        (req.query.themesType &&
          secStr.some((x) => req.query.themesType.includes(x)))
      ) {
        res
          .status(400)
          .json(ErrorResponse('Invalid query parameters', 400, 'INVALID_QUERY'))
        return
      }

      // Filter by number of player moves
      if (req.query.playerMoves) {
        queryString +=
          " AND(LENGTH(MOVES) - LENGTH(replace(MOVES, ' ', '')) + 1) = " +
          parseInt(req.query.playerMoves) * 2
      }

      // Filter by themes
      if (req.query.themes) {
        let themes

        // Parse themes from query parameter
        if (typeof req.query.themes === 'string') {
          // Handle comma-separated list
          themes = req.query.themes.split(',').map((theme) => theme.trim())
        } else if (Array.isArray(req.query.themes)) {
          // Handle repeated parameter
          themes = req.query.themes
        } else {
          res
            .status(400)
            .json(ErrorResponse('Invalid themes format', 400, 'INVALID_THEMES'))
          return
        }

        // Remove any empty themes
        themes = themes.filter((theme) => theme.length > 0)

        if (themes.length === 0) {
          res
            .status(400)
            .json(
              ErrorResponse('No valid themes provided', 400, 'INVALID_THEMES')
            )
          return
        }

        if (themes.length > 1 && !req.query.themesType) {
          res
            .status(400)
            .json(
              ErrorResponse(
                'themesType required for multiple themes',
                400,
                'MISSING_THEMES_TYPE'
              )
            )
          return
        }

        // Construct theme query
        queryString += ' AND ('
        themes.forEach((theme, index) => {
          if (index > 0) {
            queryString += req.query.themesType === 'ALL' ? ' AND ' : ' OR '
          }
          queryString += `INSTR(THEMES, '${theme}') > 0`
        })
        queryString += ')'
      }

      // Set limit and rating range
      let limit = Math.min(req.query.count ? parseInt(req.query.count) : 1, 500)
      let rating = req.query.rating
        ? parseInt(req.query.rating)
        : Math.floor(Math.random() * (3001 - 511 + 1) + 511)
      queryString +=
        ' AND ' +
        rating +
        ' BETWEEN RATING - RATINGDEVIATION AND RATING + RATINGDEVIATION '
      queryString +=
        ' ORDER BY DBMS_RANDOM.VALUE OFFSET 0 ROWS FETCH NEXT ' +
        limit +
        ' ROWS ONLY'
    }

    // Database connection and query execution
    const connectionOptions = {
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      connectionString: process.env.DB_CONNECTION_STRING,
    }
    const connection = await oracledb.getConnection(connectionOptions)
    const result = await connection.execute(queryString)

    if (result.rows.length == 0) {
      res
        .status(404)
        .json(
          ErrorResponse('No matching puzzles found', 404, 'NO_PUZZLES_FOUND')
        )
      return
    }

    // Process query results
    let puzzles = result.rows.map((pzl) => ({
      puzzleid: pzl[0],
      fen: pzl[1],
      rating: pzl[2],
      ratingdeviation: pzl[3],
      moves: pzl[4].split(' '),
      themes: pzl[5].split(' '),
    }))

    // Construct successful response
    const responseData = {
      meta: {
        status: 200,
        timestamp: new Date().toISOString(),
        length: puzzles.length,
      },
      data: {
        puzzles: puzzles,
      },
      error: null,
    }

    res.status(200).json(responseData)
  } catch (err) {
    // Handle unexpected errors
    console.error('Unexpected error:', err)
    res
      .status(500)
      .json(
        ErrorResponse(
          'An unexpected error occurred',
          500,
          'INTERNAL_SERVER_ERROR'
        )
      )
  } finally {
    // Ensure database connection is closed
    if (connection) {
      try {
        await connection.close()
      } catch (err) {
        console.error('Error closing database connection:', err)
      }
    }
  }
}
