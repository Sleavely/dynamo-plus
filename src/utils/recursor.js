
/**
 * recursion
 * /rɪˈkəːʃ(ə)n/
 *
 * Did you mean: Recursion
 *
 * @see https://www.google.com/search?q=Recursion
 */
const recursor = async (passalongs, chunkCallback) => {
  const { client, method, scanParams } = passalongs

  const data = await client[method](scanParams)
  await chunkCallback(data)

  // continue scanning if we have more items
  if (data.LastEvaluatedKey) {
    scanParams.ExclusiveStartKey = data.LastEvaluatedKey
    recursor(passalongs, chunkCallback)
  }
}

module.exports = exports = recursor
