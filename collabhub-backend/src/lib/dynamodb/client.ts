import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, BatchGetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { BaseItem } from '../../types/index.js';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.REGION || 'us-east-1',
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});

const TABLE_NAME = process.env.TABLE_NAME!;

// Get single item
export async function getItem<T extends BaseItem>(pk: string, sk: string): Promise<T | null> {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  }));
  return (result.Item as T) || null;
}

// Put item
export async function putItem<T extends BaseItem>(item: T): Promise<T> {
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));
  return item;
}

// Update item
export async function updateItem(
  pk: string,
  sk: string,
  updates: Record<string, unknown>,
  conditionExpression?: string,
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value], index) => {
    const nameKey = `#attr${index}`;
    const valueKey = `:val${index}`;
    updateExpressions.push(`${nameKey} = ${valueKey}`);
    expressionAttributeNames[nameKey] = key;
    expressionAttributeValues[valueKey] = value;
  });

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: conditionExpression,
  }));
}

// Delete item
export async function deleteItem(pk: string, sk: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { PK: pk, SK: sk },
  }));
}

// Query by partition key
export async function queryByPK<T extends BaseItem>(
  pk: string,
  skPrefix?: string,
  limit?: number,
  exclusiveStartKey?: Record<string, unknown>,
): Promise<{ items: T[]; lastKey?: Record<string, unknown> }> {
  let keyConditionExpression = 'PK = :pk';
  const expressionAttributeValues: Record<string, unknown> = { ':pk': pk };

  if (skPrefix) {
    keyConditionExpression += ' AND begins_with(SK, :skPrefix)';
    expressionAttributeValues[':skPrefix'] = skPrefix;
  }

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    Limit: limit,
    ExclusiveStartKey: exclusiveStartKey,
  }));

  return {
    items: (result.Items as T[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

// Query GSI
export async function queryGSI<T extends BaseItem>(
  indexName: string,
  pkName: string,
  pkValue: string,
  skName?: string,
  skPrefix?: string,
  limit?: number,
  scanIndexForward: boolean = true,
  exclusiveStartKey?: Record<string, unknown>,
): Promise<{ items: T[]; lastKey?: Record<string, unknown> }> {
  let keyConditionExpression = `${pkName} = :pk`;
  const expressionAttributeValues: Record<string, unknown> = { ':pk': pkValue };

  if (skName && skPrefix) {
    keyConditionExpression += ` AND begins_with(${skName}, :skPrefix)`;
    expressionAttributeValues[':skPrefix'] = skPrefix;
  }

  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    Limit: limit,
    ScanIndexForward: scanIndexForward,
    ExclusiveStartKey: exclusiveStartKey,
  }));

  return {
    items: (result.Items as T[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

// Batch get items
export async function batchGetItems<T extends BaseItem>(
  keys: Array<{ pk: string; sk: string }>,
): Promise<T[]> {
  if (keys.length === 0) return [];

  const result = await docClient.send(new BatchGetCommand({
    RequestItems: {
      [TABLE_NAME]: {
        Keys: keys.map(k => ({ PK: k.pk, SK: k.sk })),
      },
    },
  }));

  return (result.Responses?.[TABLE_NAME] as T[]) || [];
}

// Batch write items
export async function batchWriteItems<T extends BaseItem>(items: T[]): Promise<void> {
  if (items.length === 0) return;

  // DynamoDB batch write limit is 25 items
  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: chunk.map(item => ({
          PutRequest: { Item: item },
        })),
      },
    }));
  }
}

// Transaction helpers
export { docClient as dynamoClient };
export { TABLE_NAME };
