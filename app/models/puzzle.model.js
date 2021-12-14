module.exports = (sequelize, Sequelize) => {
    const Puzzle = sequelize.define("puzzle", {
      puzzleid: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      fen: {
        type: Sequelize.STRING
      },
      moves: {
        type: Sequelize.STRING
      },
      rating: {
        type: Sequelize.SMALLINT
      },
      ratingdeviation: {
        type: Sequelize.SMALLINT
      },
      themes: {
        type: Sequelize.STRING
      },
    },{timestamps:false});
  
    return Puzzle;
  };