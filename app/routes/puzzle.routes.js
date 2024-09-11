module.exports = (app) => {
  const v1 = require('../controllers/v1/puzzle.controller.js')
  const v2 = require('../controllers/v2/puzzle.controller.js')
  const router = require('express').Router()

  // v1 Route which is the original implementation and accessed directly at /api
  router.get('/', v1.mainAccess)

  // v2 Route which is the new implementation and accessed at /api/v2
  router.get('/v2', v2.mainAccess)

  // Set up the routes at /api
  app.use('/api', router)
}
