
// Throttling-related exceptions
// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.MessagesAndCodes
const retryableExceptions = [
  'LimitExceededException',
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
  'ThrottlingException',
]

module.exports = exports = retryableExceptions
