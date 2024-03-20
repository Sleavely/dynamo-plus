const neverPromise = new Promise(() => {})

interface CombinedPromiseResult<T> {
  index: number
  result: IteratorResult<T, void>
}

const getNext = async <T>(asyncIterator: AsyncIterator<T>, index: number): Promise<CombinedPromiseResult<T>> => await asyncIterator.next().then((result) => ({ index, result }))

export const combineAsyncIterables = async function * <T>(
  asyncIterables: Array<AsyncIterable<T>>,
): AsyncGenerator<T> {
  const asyncIterators = Array.from(asyncIterables, (o) => o[Symbol.asyncIterator]())
  let remainingIterables = asyncIterators.length
  const nextPromises = asyncIterators.map(getNext<T>)
  try {
    while (remainingIterables) {
      const { index, result } = await Promise.race(nextPromises)
      if (result.done) {
        nextPromises[index] = neverPromise as Promise<CombinedPromiseResult<T>>
        remainingIterables--
      } else {
        nextPromises[index] = getNext<T>(asyncIterators[index], index)
        yield result.value
      }
    }
  } finally {
    for (const [index, iterator] of asyncIterators.entries()) {
      if (nextPromises[index] !== neverPromise && iterator.return != null) {
        // no await here - see https://github.com/tc39/proposal-async-iteration/issues/126
        void iterator.return()
      }
    }
  }
}
