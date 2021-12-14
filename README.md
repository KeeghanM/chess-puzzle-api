# chess-puzzle-api
## A Simple API to access the LiChess Puzzle's Database
Puzzles Database last updated 10/12/2021
Current Puzzle Count: 2,137,287

### Puzzle Format
When you query the API you will either get a JSON object back containing an array of Puzzle objects. If you request a single puzzle (by ID, or random for example) this array will contain a single puzzle object.
Here is an example response:
```
{
    "puzzles":[
        {
            "puzzleid":"HxxIU",
            "fen":"2r2rk1/3nqp1p/p3p1p1/np1p4/3P4/P1NBP3/1PQ2PPP/2R2RK1 w - - 0 18",
            "moves":["c3d5","e6d5","c2c8","f8c8"],
            "rating":1683
            "ratingdeviation":74
            "themes":["advantage","hangingPiece","middlegame","short"]
        }
    ]
}
```
Moves are in UCI format. Use a chess library to convert them to SAN, for display.
FEN is the position before the opponent makes their move.
The position to present to the player is after applying the first move to that FEN.
The second move is the beginning of the solution.

### Current Endpoints
#### /
##### GET Random Puzzle
Hitting the root of the API will simply return a single random puzzle from the database.

#### /:id
##### GET Puzzle by ID
Passing a puzzle ID will return a single puzzle matching that ID
If no ID is found, the API will return
```
{
    message: 'Cannot find Puzzle with id=${id}.'
}
```