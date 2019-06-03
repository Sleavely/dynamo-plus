
const clientMethods = require('./clientMethods')
const sleep = require('./utils/sleep')

// Throttling-related exceptions
// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.MessagesAndCodes
const retryableExceptions = [
  'LimitExceededException',
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
  'ThrottlingException',
]

const autoRetry = (client) => {
  clientMethods.forEach((method) => {
    client[method] = async (params = {}) => {
      return client[method](params).catch((err) => {
        if (retryableExceptions.some((retry) => [err.constructor.name, err.name].includes(retry))) {
          params.lastBackOff = params.lastBackOff ? Math.min(Math.floor(params.lastBackOff * 1.5), 30000) : 1000
          return sleep(params.lastBackOff)
            .then(() => client[method](params))
        }
        // Non-retryable exceptions (like ValidationException) should incur actual error propagation
        throw err
      })
    }
  })
}

module.exports = exports = {
  autoRetry,
  retryableExceptions,
}
