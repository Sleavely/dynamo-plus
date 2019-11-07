
const batchWriteRetry = require('./utils/batchWriteRetry')
const chunk = require('./utils/chunk')

exports.appendPutAll = (client) => {
  client.putAll = async (params = {}) => {
    const {
      TableName = '',
      Items = [],
      BatchSize = 25,
    } = params

    const batches = chunk(Items, BatchSize)

    // Build a chain of batchWrite operations
    return batches.reduce(async (chain, batch) => {
      await chain

      return batchWriteRetry(client, {
        RequestItems: {
          [TableName]: batch.map((item) => ({ PutRequest: { Item: item } }))
        }
      })
    }, Promise.resolve())
  }
}
