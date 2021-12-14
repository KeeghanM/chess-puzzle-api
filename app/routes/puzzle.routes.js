module.exports = app => {
    const puzzles = require("../controllers/puzzle.controller.js");
    var router = require("express").Router();

    //get one random puzzle
    router.get("/", puzzles.getRandom);
    //get one puzzle by id
    router.get("/:id", puzzles.getOne);

    app.use('/api/puzzles', router);
};