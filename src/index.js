
const DynamoDB = require('aws-sdk/clients/dynamodb')
const promisifyDocumentClient = require('./promisifyDocumentClient')
const {
  autoRetry,
  retryableExceptions,
} = require('./retryableExceptions')
const appendScanExtentions = require('./scanExtensions')

const clientConstructor = (options = {}) => {
  const dynamoClient = new DynamoDB.DocumentClient(options)
  promisifyDocumentClient(dynamoClient)
  autoRetry(dynamoClient)
  appendScanExtentions(dynamoClient)
  return dynamoClient
}

module.exports = exports = {
  DynamoPlus: clientConstructor,
  retryableExceptions
}
