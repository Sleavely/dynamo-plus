
const DynamoDB = require('aws-sdk/clients/dynamodb')
const promisifyDocumentClient = require('./promisifyDocumentClient')
const {
  autoRetry,
  retryableExceptions,
} = require('./retryableExceptions')
const {
  appendDeleteAll,
} = require('./deleteAll')
const {
  appendPutAll,
} = require('./putAll')
const {
  appendQueryExtensions,
} = require('./queryExtensions')
const {
  appendScanExtensions,
} = require('./scanExtensions')

const clientConstructor = (options = {}) => {
  const dynamoClient = new DynamoDB.DocumentClient(options)
  promisifyDocumentClient(dynamoClient)
  autoRetry(dynamoClient)
  appendDeleteAll(dynamoClient)
  appendPutAll(dynamoClient)
  appendQueryExtensions(dynamoClient)
  appendScanExtensions(dynamoClient)
  return dynamoClient
}

module.exports = exports = {
  DynamoPlus: clientConstructor,
  retryableExceptions,
}
