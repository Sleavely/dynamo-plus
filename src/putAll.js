
const chunk = require('./utils/chunk')

exports.batchWriteRetry = async (client, writeParams) => {
  const { UnprocessedItems = {} } = await client.batchWrite(writeParams)

  if (Object.keys(UnprocessedItems).length) {
    return exports.batchWriteRetry(client, { RequestItems: UnprocessedItems })
  }
}

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

      return exports.batchWriteRetry(client, {
        RequestItems: {
          [TableName]: batch.map((item) => ({ PutRequest: { Item: item } }))
        }
      })
    }, Promise.resolve())
  }
}
