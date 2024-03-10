import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  type TranslateConfig,
  paginateQuery,
  paginateScan,

  BatchGetCommand,
  type BatchGetCommandInput,
  type BatchGetCommandOutput,
  BatchWriteCommand,
  type BatchWriteCommandInput,
  type BatchWriteCommandOutput,
  DeleteCommand,
  type DeleteCommandInput,
  type DeleteCommandOutput,
  GetCommand,
  type GetCommandInput,
  PutCommand,
  type PutCommandInput,
  type PutCommandOutput,
  QueryCommand,
  type QueryCommandInput,
  type QueryCommandOutput,
  ScanCommand,
  type ScanCommandInput,
  type ScanCommandOutput,
  TransactGetCommand,
  type TransactGetCommandInput,
  type TransactGetCommandOutput,
  TransactWriteCommand,
  type TransactWriteCommandInput,
  type TransactWriteCommandOutput,
  UpdateCommand,
  type UpdateCommandInput,
  type UpdateCommandOutput,
} from '@aws-sdk/lib-dynamodb'
import { chunk } from './utils/chunk'
import { batchWriteRetry } from './utils/batchWriteRetry'
import { batchReadRetry } from './utils/batchReadRetry'

/**
 * Re-throws errors to avoid callstacks being discarded between ticks
 */
const throwErrorWithCallstack = async (err: Error): Promise<never> => {
  throw new Error(err.message)
}

interface DeleteAllInput {
  TableName: string
  Keys: Array<Record<string, unknown>>
  BatchSize?: number
}
type GetAllInput = Omit<GetCommandInput, 'Key' | 'TableName'>
& {
  TableName: string
  Keys: Array<Record<string, unknown>>
  BatchSize?: number
}
type PutAllInput = Omit<PutCommandInput, 'Item' | 'TableName'>
& {
  TableName: string
  Items: Array<PutCommandInput['Item']>
  BatchSize?: number
}

export class DynamoPlus {
  client: DynamoDBDocumentClient

  constructor (dynamoDBClientConfig: DynamoDBClientConfig = {}, translateConfig: TranslateConfig = {}) {
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient(dynamoDBClientConfig),
      translateConfig,
    )
  }

  // #region Core Methods
  async batchGet (input: BatchGetCommandInput): Promise<BatchGetCommandOutput> {
    return await this.client
      .send(new BatchGetCommand(input))
      .catch(throwErrorWithCallstack)
  }

  async batchWrite (input: BatchWriteCommandInput): Promise<BatchWriteCommandOutput> {
    return await this.client
      .send(new BatchWriteCommand(input))
      .catch(throwErrorWithCallstack)
  }

  async delete (input: DeleteCommandInput): Promise<DeleteCommandOutput> {
    return await this.client
      .send(new DeleteCommand(input))
      .catch(throwErrorWithCallstack)
  }

  async get <ExpectedReturnType = unknown>(input: GetCommandInput): Promise<ExpectedReturnType | undefined> {
    const result = await this.client
      .send(new GetCommand(input))
      .catch(throwErrorWithCallstack)
    return result.Item
      ? result.Item as ExpectedReturnType
      : undefined
  }

  async put (input: PutCommandInput): Promise<PutCommandOutput> {
    return await this.client
      .send(new PutCommand(input))
      .catch(throwErrorWithCallstack)
  }

  async query (input: QueryCommandInput): Promise<QueryCommandOutput> {
    return await this.client
      .send(new QueryCommand(input))
      .catch(throwErrorWithCallstack)
  }

  async scan (input: ScanCommandInput): Promise<ScanCommandOutput> {
    return await this.client
      .send(new ScanCommand(input))
      .catch(throwErrorWithCallstack)
  }

  async transactGet (input: TransactGetCommandInput): Promise<TransactGetCommandOutput> {
    return await this.client
      .send(new TransactGetCommand(input))
      .catch(throwErrorWithCallstack)
  }

  async transactWrite (input: TransactWriteCommandInput): Promise<TransactWriteCommandOutput> {
    return await this.client
      .send(new TransactWriteCommand(input))
      .catch(throwErrorWithCallstack)
  }

  async update (input: UpdateCommandInput): Promise<UpdateCommandOutput> {
    return await this.client
      .send(new UpdateCommand(input))
      .catch(throwErrorWithCallstack)
  }
  // #endregion

  // #region dynamo-plus addons
  async deleteAll (params: DeleteAllInput): Promise<void> {
    const {
      TableName,
      Keys,
      BatchSize = 25,
    } = params

    if (BatchSize > 25) throw new Error('Cant batch more than 25 items at a time: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html')
    const batches = chunk(Keys, BatchSize)

    // Build a chain of batchWrite operations
    await batches.reduce(async (chain, batch) => {
      await chain

      await batchWriteRetry(this, {
        RequestItems: {
          [TableName]: batch.map((key) => ({ DeleteRequest: { Key: key } })),
        },
      })
    }, Promise.resolve())
  }

  async getAll <ExpectedReturnType = unknown>(params: GetAllInput): Promise<ExpectedReturnType[]> {
    const {
      TableName,
      Keys = [],
      BatchSize = 100,
    } = params

    if (BatchSize > 100) throw new Error('Cant retrieve more than 100 items at a time: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchGetItem.html')
    const batches = chunk<GetAllInput['Keys'][number]>(Keys, BatchSize)

    // Build a chain of batchWrite operations
    return await batches.reduce<Promise<ExpectedReturnType[]>>(async (chain, batch) => {
      const previousResults = await chain

      const output = await batchReadRetry(this, {
        RequestItems: {
          [TableName]: {
            Keys: batch,
          },
        },
      })
      return [...previousResults, ...(output[TableName] ? output[TableName] as ExpectedReturnType[] : [])]
    }, Promise.resolve([]))
  }

  async putAll (params: PutAllInput): Promise<void> {
    const {
      TableName,
      Items,
      BatchSize = 25,
    } = params

    if (BatchSize > 25) throw new Error('Cant batch more than 25 items at a time: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html')
    const batches = chunk(Items, BatchSize)

    // Build a chain of batchWrite operations
    await batches.reduce(async (chain, batch) => {
      await chain

      await batchWriteRetry(this, {
        RequestItems: {
          [TableName]: batch.map((item) => ({ PutRequest: { Item: item } })),
        },
      })
    }, Promise.resolve())
  }

  async queryAll <ExpectedReturnType = unknown>(params: QueryCommandInput, pageSize = 100): Promise<ExpectedReturnType[]> {
    const paginator = paginateQuery({ client: this.client, pageSize }, params)
    const results = []
    for await (const page of paginator) {
      if (page.Items) results.push(...(page.Items as ExpectedReturnType[]))
    }
    return results
  }

  async * queryIterator <ExpectedReturnType = unknown>(params: QueryCommandInput, pageSize = 100): AsyncGenerator<Awaited<ExpectedReturnType>> {
    const paginator = paginateQuery({ client: this.client, pageSize }, params)
    for await (const page of paginator) {
      if (page.Items) {
        for (const item of page.Items) {
          yield item as ExpectedReturnType
        }
      }
    }
  }

  async scanAll <ExpectedReturnType = unknown>(params: ScanCommandInput, pageSize = 100): Promise<ExpectedReturnType[]> {
    const paginator = paginateScan({ client: this.client, pageSize }, params)
    const results = []
    for await (const page of paginator) {
      if (page.Items) results.push(...(page.Items as ExpectedReturnType[]))
    }
    return results
  }

  async * scanIterator <ExpectedReturnType = unknown>(params: ScanCommandInput, pageSize = 100): AsyncGenerator<Awaited<ExpectedReturnType>> {
    const paginator = paginateScan({ client: this.client, pageSize }, params)
    for await (const page of paginator) {
      if (page.Items) {
        for (const item of page.Items) {
          yield item as ExpectedReturnType
        }
      }
    }
  }
  // #endregion
}
