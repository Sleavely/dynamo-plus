
module.exports = exports = async (sleepTime = 1000, resolveWith = undefined) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(resolveWith)
    }, sleepTime)
  })
}
