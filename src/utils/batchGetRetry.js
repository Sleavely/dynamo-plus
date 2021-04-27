
const batchReadRetry = async (client, getParams) => {
  const { Responses = {}, UnprocessedKeys = {} } = await client.batchGet(getParams)

  if (Object.keys(UnprocessedKeys).length) {
    // Retry and merge the output
    const retriedResponses = await batchReadRetry(client, { ...getParams, RequestItems: UnprocessedKeys })

    Object.keys(retriedResponses).forEach((tableName) => {
      if (!Responses[tableName]) Responses[tableName] = []
      Responses[tableName].push(...retriedResponses[tableName])
    })
  }
  return Responses
}

module.exports = exports = batchReadRetry
