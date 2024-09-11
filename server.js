const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const ErrorResponse = require('./app/controllers/v2/utils/errorResponse.js')

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
require('./app/routes/puzzle.routes.js')(app)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res
    .status(500)
    .json(
      ErrorResponse(
        err.message || 'Internal Server Error',
        500,
        'INTERNAL_SERVER_ERROR'
      )
    )
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})
