
const clientMethods = require('./clientMethods')
const sleep = require('./utils/sleep')

// Throttling-related exceptions
// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.MessagesAndCodes
const retryableExceptions = [
  'InternalServerError',
  'LimitExceededException',
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
  'ThrottlingException',
]

const autoRetry = (client) => {
  clientMethods.forEach((method) => {
    // Save a reference to the unmutated version of the method.
    // We're not storing it on the client as a prop since
    // it is probably not the original original.
    const originalMethod = client[method]

    client[method] = async (params = {}) => {
      return originalMethod(params).catch((err) => {
        const retryableException = retryableExceptions.find((retry) => [err.constructor.name, err.name].includes(retry))

        if (retryableException) {
          // Back off by 150% every time,
          // starting at 1 sec and a maximum of 30 sec between tries.
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
