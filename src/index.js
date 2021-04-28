
const https = require('https')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const promisifyDocumentClient = require('./promisifyDocumentClient')
const {
  autoRetry,
  retryableExceptions,
} = require('./retryableExceptions')
const {
  appendGetAll,
} = require('./getAll')
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
  const keepaliveAgent = new https.Agent({
    keepAlive: true,
  })
  const clientOptions = {
    ...options,
    httpOptions: {
      agent: keepaliveAgent,
      // Allow users to supply their own agent
      ...(options.httpOptions || {}),
    },
  }

  const dynamoClient = new DynamoDB.DocumentClient(clientOptions)
  promisifyDocumentClient(dynamoClient)
  autoRetry(dynamoClient)
  appendGetAll(dynamoClient)
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
