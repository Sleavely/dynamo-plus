
const batchWriteRetry = async (client, writeParams) => {
  const { UnprocessedItems = {} } = await client.batchWrite(writeParams)

  if (Object.keys(UnprocessedItems).length) {
    return batchWriteRetry(client, { RequestItems: UnprocessedItems })
  }
}

module.exports = exports = batchWriteRetry
