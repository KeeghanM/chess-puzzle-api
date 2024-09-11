# [ChessPuzzle API](https://rapidapi.com/KeeghanM/api/chess-puzzles)

## A Simple API to access over 2 Million Chess Puzzles

This API uses puzzles provided by LiChess but is a 3rd party solution not affiliated with LiChess.

If you wish to access the LiChess puzzle collection yourself you can do so here: https://database.lichess.org/#puzzles

Puzzles Database last updated 10/12/2021

Current Puzzle Count: 2,137,287

## API Versions

The API is currently available in two versions, where V1 is maintained for backward compatibility. New features and improvements are available in V2.

### Upgrading from V1 to V2

To upgrade from V1 to V2, make the following changes:

1. Update your API endpoint from /api/ to /api/v2/.
2. Update the themes parameter:
   - V1: `?themes=["endgame","passedPawn","crushing"]`
   - V2: `?themes=endgame,passedPawn,crushing` or `?themes=endgame&themes=passedPawn&themes=crushing`
3. Update how you access the puzzle data in the response (see "Response Format" section below).
4. Error responses now include more detailed information and consistent formatting.

All other parameters and functionalities remain the same between versions.

## Response Format

### V1 Response Format

In V1, the response directly contains an array of puzzles:

```json
{
  "puzzles": [
    {
      "puzzleid": "HxxIU",
      "fen": "2r2rk1/3nqp1p/p3p1p1/np1p4/3P4/P1NBP3/1PQ2PPP/2R2RK1 w - - 0 18",
      "moves": ["c3d5", "e6d5", "c2c8", "f8c8"],
      "rating": 1683,
      "ratingdeviation": 74,
      "themes": ["advantage", "hangingPiece", "middlegame", "short"]
    }
  ]
}
```

### V2 Response Format

In V2, the response is structured with meta-information and the puzzle data is nested:

```json
{
  "meta": {
    "status": 200,
    "timestamp": "2024-09-11T12:34:56Z",
    "length": 1
  },
  "data": {
    "puzzles": [
      {
        "puzzleid": "HxxIU",
        "fen": "2r2rk1/3nqp1p/p3p1p1/np1p4/3P4/P1NBP3/1PQ2PPP/2R2RK1 w - - 0 18",
        "moves": ["c3d5", "e6d5", "c2c8", "f8c8"],
        "rating": 1683,
        "ratingdeviation": 74,
        "themes": ["advantage", "hangingPiece", "middlegame", "short"]
      }
    ]
  },
  "error": null
}
```

### Accessing Puzzle Data

- In V1: `response.puzzles`
- In V2: `response.data.puzzles`

### Meta Information

The `meta` object in V2 responses contains the following fields:

- `status`: HTTP status code of the response (e.g., 200 for success)
- `timestamp`: ISO8601 formatted timestamp of when the response was generated
- `length`: Number of puzzles returned in this response

This meta information can be useful for debugging, logging, and understanding the context of the response.

### Puzzle Format

When you query the API you will always get back an array of Puzzle objects. If you request a single puzzle this array will contain a single puzzle object.
Here is an example response:

```json
{
  "meta": {
    "status": 200,
    "timestamp": "2024-09-11T12:34:56Z",
    "length": 1
  },
  "data": {
    "puzzles": [
      {
        "puzzleid": "HxxIU",
        "fen": "2r2rk1/3nqp1p/p3p1p1/np1p4/3P4/P1NBP3/1PQ2PPP/2R2RK1 w - - 0 18",
        "moves": ["c3d5", "e6d5", "c2c8", "f8c8"],
        "rating": 1683,
        "ratingdeviation": 74,
        "themes": ["advantage", "hangingPiece", "middlegame", "short"]
      }
    ]
  },
  "error": null
}
```

Moves are in UCI format. Use a chess library to convert them to SAN, for display.
FEN is the position before the opponent makes their move.
The position to present to the player is after applying the first move to that FEN.
The second move is the beginning of the solution.

### Using The API

To access the API you must register with [RapidAPI](https://rapidapi.com/KeeghanM/api/chess-puzzles/) doing so is 100% free, and the API is available for free consumption.

All queries are handled by query string parameters. The currently available parameters are:

#### BLANK

Leaving the query blank and simply hitting the root / of the API will return a single random puzzle.

#### id

Passing in an ID will return one puzzle matching that ID. Even if you pass other variables, including an ID overrides them all and will always return a single puzzle matching that id.

If the id is invalid or doesn't match a puzzle in the database, a status 400 error will be returned.

#### rating

Pass an int to return puzzles around this rating level. This uses the ratingVariation of the puzzle to determine if it's within range.

So for example, if you pass `?rating=1500` you could get a puzzle of 1430 if it's rating variation is 70

The SQL query is `WHERE rating BETWEEN rating-deviation AND rating+deviation`

#### count

Pass an int between 1 and 500 to return that many puzzles

If you send a _very_ specific request, you may find you get back less than the requested number.

However, any rating and up to 3 themes should never fail to return 500 matching puzzles.

#### themes

Every puzzle has been tagged with a set of themes.

V1: Pass in an array like `?themes=["endgame","passedPawn","crushing"]`
V2: Pass a comma-separated list like `?themes=endgame,passedPawn,crushing` or use repeated parameters like `?themes=endgame&themes=passedPawn&themes=crushing`

To select just one theme in V1, you pass an array with a single item like `?themes=["middlegame"]`
In V2, simply pass `?themes=middlegame`

For a full list of themes see [LiChess Documentation](https://github.com/ornicar/lila/blob/master/translation/source/puzzleTheme.xml)

#### themesType

If you pass more than one theme you **MUST** include a themesType

This can either be the string `ALL` or `ONE` and sets whether the puzzle must match ALL or only ONE of the submitted themes

#### playerMoves

Send an int to get puzzles containing that many moves for the player to make

Majority of puzzles are either 2, 3, or 4 moves

Any higher and you severely start limiting the number of puzzles available

### Error Handling

In V2, all error responses follow a consistent format:

```json
{
  "meta": {
    "status": 400,
    "timestamp": "2024-09-11T12:34:56Z",
    "length": 0
  },
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message describing the issue"
  }
}
```

Available error codes include:

- `UNAUTHORIZED`: The API key is invalid or missing
- `INVALID_PUZZLE_ID`: The requested puzzle ID does not match the expected format
- `INVALID_QUERY`: The query parameters are invalid or you are missing required parameters
- `INVALID_THEMES`: The themes provided are in the wrong format, or you have passed an empty themes array
- `MISSING_THEMES_TYPE`: You have passed multiple themes, but not included a `themesType`
- `NO_PUZZLES_FOUND`: Your request found no matching puzzles, try to remove some conditions
- `INTERNAL_SERVER_ERROR`: Something went wrong our side, please wait and try again
