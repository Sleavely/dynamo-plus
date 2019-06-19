
const methodsToPromisify = require('./clientMethods')

/**
 * Transforms the documentclient instance so that all methods use .promise() by default.
 *
 * This is a mutable operation.
 */
const promisifyDocumentClient = (client) => {
  methodsToPromisify.forEach((method) => {
    // Depending on aws-sdk version, transactions might not be available
    if (!client[method]) {
      delete methodsToPromisify[method]
      return undefined
    }

    client[`original_${method}`] = client[method]
    client[method] = async (params = {}) => {
      return client[`original_${method}`](params).promise()
    }
  })
}

module.exports = exports = promisifyDocumentClient
