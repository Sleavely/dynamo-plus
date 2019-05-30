# Dynamo Plus

[ ![npm version](https://img.shields.io/npm/v/dynamo-plus.svg?style=flat) ](https://npmjs.org/package/dynamo-plus "View this project on npm") [ ![CircleCI](https://circleci.com/gh/Sleavely/dynamo-plus.svg?style=svg) ](https://circleci.com/gh/Sleavely/dynamo-plus) [ ![Issues](https://img.shields.io/github/issues/Sleavely/dynamo-plus.svg) ](https://github.com/Sleavely/dynamo-plus/issues)

> Extend and supercharge your DynamoDB DocumentClient

[API Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html) (minus the callbacks, of course)

# Installation

```shell
npm i dynamo-plus
```

```js
const { DynamoPlus } = require('dynamo-plus')
const client = DynamoPlus({
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

## .promise() by default

When the client is instantiated, the original methods are prefixed and accessible through e.g. ``original_${method}``

## retries and backoff

Whenever a query fails for reasons such as `LimitExceededException` the promise will reboot behind the scenes so that you don't have to worry about it.

For information about retryable exceptions, see https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Programming.Errors.html#Programming.Errors.MessagesAndCodes

If you want to use a delay from the beginning, set `lastBackOff` to a millisecond value in the query params.

# FAQ

### I'm getting errors that the `aws-sdk` module isn't installed.

`aws-sdk` is set as a dev-dependency since it is pretty large and installed by default on AWS Lambda.

### I need to use the regular client methods for some edge case.

They are all available as `original_get` and similar:

```js
const { DynamoPlus } = require('dynamo-plus')
const client = DynamoPlus()

client.original_get(myParams, (err, data) => {})
// or
client.original_get(myParams).promise()
```

Automatic retries don't apply to the original methods.


### None of these questions seem to be questions.

That's a statement, but I see your point.
