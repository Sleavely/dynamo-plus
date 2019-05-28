
const retryableExceptions = require('./retryableExceptions')
const sleep = require('./utils/sleep')

/**
 * Transforms the documentclient instance so that all methods use .promise() by default.
 *
 * This is a mutable operation.
 */
const promisifyDocumentClient = (client) => {
  const methods = [
    'batchGet',
    'batchWrite',
    'createSet',
    'delete',
    'get',
    'put',
    'query',
    'scan',
    'transactGet',
    'transactWrite',
    'update',
  ]

  methods.forEach((method) => {
    client[`original_${method}`] = client[method]
    client[method] = async (params = {}) => {
      return client[`original_${method}`](params).promise()
        .catch((err) => {
          if (retryableExceptions.some((retry) => [err.constructor.name, err.name].includes(retry))) {
            params.lastBackOff = params.lastBackOff ? Math.floor(params.lastBackOff * 1.5) : 1000
            return sleep(params.lastBackOff)
              .then(() => client[method](params))
          }
          // Non-retryable exceptions (like ValidationException) should incur actual error propagation
          throw err
        })
    }
  })
}

module.exports = exports = promisifyDocumentClient
