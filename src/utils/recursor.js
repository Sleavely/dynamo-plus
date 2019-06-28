
/**
 * recursion
 * /rɪˈkəːʃ(ə)n/
 *
 * Did you mean: Recursion
 *
 * @see https://www.google.com/search?q=Recursion
 */
const recursor = async (passalongs, chunkCallback) => {
  const { client, method, params } = passalongs

  const data = await client[method](params)
  await chunkCallback(data)

  // continue scanning if we have more items
  if (data.LastEvaluatedKey) {
    params.ExclusiveStartKey = data.LastEvaluatedKey
    recursor(passalongs, chunkCallback)
  }
}

module.exports = exports = recursor
