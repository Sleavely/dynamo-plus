
/**
 * Split an array into arrays no larger than chunkSize
 *
 * @param {Array<any>} originalArr
 * @param {Number} chunkSize
 * @return {Array<Array<any>>}
 */
module.exports = exports = (originalArr, chunkSize) => {
  const input = Array.from(originalArr)
  const chunks = []

  while (input.length) {
    chunks.push(input.splice(0, chunkSize))
  }

  return chunks
}
