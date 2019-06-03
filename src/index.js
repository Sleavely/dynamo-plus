
const DynamoDB = require('aws-sdk/clients/dynamodb')
const promisifyDocumentClient = require('./promisifyDocumentClient')
const {
  autoRetry,
  retryableExceptions,
} = require('./retryableExceptions')

const clientConstructor = (options = {}) => {
  const dynamoClient = new DynamoDB.DocumentClient(options)
  promisifyDocumentClient(dynamoClient)
  autoRetry(dynamoClient)
  return dynamoClient
}

module.exports = exports = {
  DynamoPlus: clientConstructor,
  retryableExceptions
}
