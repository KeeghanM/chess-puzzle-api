/**
 * Generates a standardized error response object.
 * @param {string} message - The error message.
 * @param {number} status - The HTTP status code.
 * @param {string} code - A unique error code for easier client-side handling.
 * @returns {Object} Standardized error response object.
 */
exports.ErrorResponse = (message, status, code) => {
  return {
    meta: {
      status,
      timestamp: new Date().toISOString(),
      length: 0, // Always 0 for error responses
    },
    data: null,
    error: {
      code,
      message,
    },
  }
}
