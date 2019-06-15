
/**
 * Manually emit an event.
 *
 * @param {EventEmitter} emitter
 * @param {string} eventName
 * @param {*} data One or more arguments to emit to the listeners.
 * @return {Promise<Array>} The resolved values from all listeners.
 */
const allListeners = async (emitter, eventName, ...data) => {
  return Promise.all(emitter.listeners(eventName).map((listener) => listener(...data)))
}

module.exports = exports = allListeners
