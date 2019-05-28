# Dynamo Plus [![CircleCI](https://circleci.com/gh/Sleavely/dynamo-plus/tree/master.svg?style=svg&circle-token=3d9ba39451f3fd7173df433bf09d48bd69e2ecb7)](https://circleci.com/gh/Sleavely/dynamo-plus/tree/master)

> Extend and supercharge your DynamoDB.DocumentClient

# Installation

```shell
npm i dynamo-plus
```

```js
const { DynamoPlus } = require('dynamo-plus')
const client = new DynamoPlus({
  region: 'eu-west-1',
})

const regularDynamoParams = {
  TableName: 'myTable',
  Key: {
    myKey: '1337'
  }
}
const data = await client.get(regularDynamoParams)
```

# Features

- automatically appends .promise()
- automatically retries and backs off when you get throttled
- provides additional convenience methods

## .promise() by default

When the client is instantiated, the original methods are prefixed and accessible through e.g. ``original_${method}``

## retries and backoff

Whenever a query fails for reasons such as `LimitExceededException` the promise will reboot behind the scenes so that you don't have to worry about it.

For information about retryable exceptions, see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.MessagesAndCodes

If you want to use a delay from the beginning, set `lastBackOff` to a millisecond value in the query params.

## Convenience methods

### scanTable()

A modified version of scan(). [Same call signature](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property).

Automatically traverses through pagination and resolves with the entire resultset.

### streamTable()

Similar to scanTable(), this one goes through the entirety of your table, but uses an _EventEmitter_ so that you don't have to keep your entire resultset in memory.


# FAQ

### I'm getting errors that the `aws-sdk` module isn't installed.

`aws-sdk` is set as a dev-dependency since it is pretty large and installed by default on AWS Lambda.

### I need to use the regular client methods for some edge case.

They are all available as `original_get` and similar:

```js
const { DynamoPlus } = require('dynamo-plus')
const client = new DynamoPlus()

client.original_get(myParams, (err, data) => {})
// or
client.original_get(myParams).promise()
```

Automatic retries don't apply to the original methods.


### None of these questions seem to be questions.

That's a statement, but I see your point.
