# [ChessPuzzle API] (https://rapidapi.com/KeeghanM/api/chess-puzzles)
## A Simple API to access over 2 Million Chess Puzzles
This API uses puzzles provided by LiChess but is a 3rd party solution not affiliated with LiChess.
If you wish to access the LiChess puzzle collection yourself you can do so here: https://database.lichess.org/#puzzles
Puzzles Database last updated 10/12/2021
Current Puzzle Count: 2,137,287

### Puzzle Format
When you query the API you will get back a JSON object containing an array of Puzzle objects. If you request a single puzzle this array will contain a single puzzle object.
Here is an example response:
```
{
    "puzzles":[
        {
            "puzzleid":"HxxIU",
            "fen":"2r2rk1/3nqp1p/p3p1p1/np1p4/3P4/P1NBP3/1PQ2PPP/2R2RK1 w - - 0 18",
            "moves":["c3d5","e6d5","c2c8","f8c8"],
            "rating":1683,
            "ratingdeviation":74,
            "themes":["advantage","hangingPiece","middlegame","short"]
        }
    ]
}
```
Moves are in UCI format. Use a chess library to convert them to SAN, for display.
FEN is the position before the opponent makes their move.
The position to present to the player is after applying the first move to that FEN.
The second move is the beginning of the solution.

### Using The API
To access the API you must register with [RapidAPI](https://rapidapi.com/KeeghanM/api/chess-puzzles/) doing so is 100% free, and the API is available for free consumption.
All queries are handle by query string parameters. The currently available parameters are

#### BLANK
Leaving the query blank and simply hitting the root / of the API will return a single random puzzle.

#### id
Passing in an ID will return one puzzle matching that ID. Even if you pass other variables, including an ID overides them all and will always return a single puzzle matching that id.
If the id is invalid or doesn't match a puzzle in the database, a status 400 error will be returned

#### rating
Pass an int to return puzzles around this rating level. This uses the ratingVariation of the puzzle to determine if it's within range.
So for example, if you pass `?rating=1500` you could get a puzzle of 1430 if it's rating variation is 70
The SQL query is `WHERE rating BETWEEN rating-deviation AND rating+deviation`

#### count
Pass an int between 1 and 500 to return that many puzzles
If you send a *very* specific request, you may find you get back less than the requested number.
However, any rating and up to 3 themes should never fail to return 500 matching puzzles.

#### themes
every puzzle has been tagged with a set of themes.
Pass in an array like `?themes=["endgame","passedPawn","crushing"]` 
To select just one theme, you pass an array with a single item like `?themes=["middlegame]`

For a full list of themes see [LiChess Documentation](https://github.com/ornicar/lila/blob/master/translation/source/puzzleTheme.xml)

#### themesType
If you pass more than one theme you **MUST** include a themesType
This can either be the string `ALL` or `ONE` and sets whether the puzzle must match ALL or only ONE of the submitted themes

#### playerMoves
Send an int to get puzzles containing that many moves for the player to make
Majority of puzzles are either 2, 3, or 4 moves
Any higher and you severely start limiting the number of puzzles available
