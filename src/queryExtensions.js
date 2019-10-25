
const { EventEmitter } = require('events')
const allListeners = require('./utils/allListeners')
const recursor = require('./utils/recursor')

const queryRecursor = async (passalongs, chunkCallback) => {
  passalongs.method = 'query'
  passalongs.params = passalongs.queryParams
  delete passalongs.queryParams
  return recursor(passalongs, chunkCallback)
}

const queryEmitter = (client, queryParams, synchronous = false) => {
  const emitter = new EventEmitter()

  queryRecursor({ client, queryParams }, async (data) => {
    if (synchronous) {
      await allListeners(emitter, 'data', data)
      await allListeners(emitter, 'items', data.Items)
    } else {
      emitter.emit('data', data)
      emitter.emit('items', data.Items)
    }

    if (!data.LastEvaluatedKey) {
      emitter.emit('done')
    }
  }).catch((err) => {
    emitter.emit('error', err)
  })
  return emitter
}

exports.appendQueryExtensions = (client) => {
  client.queryAll = async (queryParams = {}) => {
    return new Promise((resolve, reject) => {
      const items = []
      try {
        queryRecursor({ client, queryParams }, async (data) => {
          data.Items.forEach(item => items.push(item))
          if (!data.LastEvaluatedKey) resolve(items)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  client.queryStream = (queryParams = {}) => {
    return queryEmitter(client, queryParams)
  }

  client.queryStreamSync = (queryParams = {}) => {
    return queryEmitter(client, queryParams, true)
  }
}
