
/**
 * Append optional extra function for scanning recursively
 */
const scanRecursor = (passalongs, chunkCallback) => {
  const { scanParams } = passalongs
  const errorHandler = (err) => {
    if (retryableExceptions.some((retry) => [err.constructor.name, err.name].includes(retry))) {
      // Default value..
      passalongs.backoffTimer = passalongs.backoffTimer || 4000
      // but we're always incrementing it so the default is actually 6 seconds
      passalongs.backoffTimer = Math.floor(passalongs.backoffTimer * 1.5)
      setTimeout(() => scanRecursor(passalongs, chunkCallback), passalongs.backoffTimer)
    } else {
      throw err
    }
  }
  try {
    dynamoClient.scan(scanParams)
      .then((data) => {
        chunkCallback(data)

        // continue scanning if we have more items
        if (data.LastEvaluatedKey) {
          scanParams.ExclusiveStartKey = data.LastEvaluatedKey
          // Reset previously set backoffs
          if (passalongs.backoffTimer) delete passalongs.backoffTimer
          dynamoClient.scan(scanParams, scanRecursor(passalongs, chunkCallback))
        }
      })
      .catch((err) => {
        errorHandler(err)
      })
  } catch (err) {
    errorHandler(err)
  }
}

/**
 * Scan a table into memory.
 *
 * @returns {Promise<Array>} Resolves with an array of Items
 */
dynamoClient.scanAll = (opts = {}) => {
  const options = {
    ...opts
  }

  return new Promise((resolve, reject) => {
    const items = []
    try {
      scanRecursor({ scanParams: options }, (data) => {
        data.Items.forEach(item => items.push(item))
        if (!data.LastEvaluatedKey) resolve(items)
      })
    } catch (err) {
      reject(err)
    }
  })
}
