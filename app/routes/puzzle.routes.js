module.exports = app => {
    const puzzles = require("../controllers/puzzle.controller.js");
    var router = require("express").Router();

    // The main puzzle API is accessed from the one root route
    // with different options specified by query string
    router.get("/", puzzles.mainAccess);

    app.use('/api', router);
};