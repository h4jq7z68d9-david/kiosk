// In-memory stand-ins for every @aws-sdk export index.mjs imports. hooks.mjs points all
// '@aws-sdk/*' specifiers here, so the Lambda loads without the SDK installed and without
// credentials. Every send() is appended to `log` so a test can assert what was touched.
//
// DynamoDB: tables are Maps keyed by `id`. Get/Put/Delete/Scan work on the store; Scan honours
// the one FilterExpression the Lambda uses ('id = :id'); Query returns nothing; Update is
// recorded but not applied (tests assert on the recorded command, not on state).

class Command { constructor(input) { this.input = input; this.name = new.target.name; } }
export class SendEmailCommand extends Command {}
export class PutItemCommand   extends Command {}
export class GetCommand       extends Command {}
export class PutCommand       extends Command {}
export class DeleteCommand    extends Command {}
export class ScanCommand      extends Command {}
export class QueryCommand     extends Command {}
export class UpdateCommand    extends Command {}
export class PutObjectCommand extends Command {}
export class GetObjectCommand extends Command {}

export const log = [];                 // every send(): { client, name, input }
export const tables = new Map();       // TableName -> Map(id -> item)
export const table = (t) => { if (!tables.has(t)) tables.set(t, new Map()); return tables.get(t); };
export function reset() { log.length = 0; tables.clear(); }

class FakeClient {
  constructor(kind) { this.kind = kind; }
  async send(cmd) {
    log.push({ client: this.kind, name: cmd.name, input: cmd.input });
    if (this.kind !== 'dynamo') return {};
    const { TableName, Key, Item, FilterExpression, ExpressionAttributeValues } = cmd.input || {};
    const t = table(TableName);
    switch (cmd.name) {
      case 'GetCommand':    return { Item: t.get(Key?.id) };
      case 'PutCommand':    t.set(Item.id, Item); return {};
      case 'DeleteCommand': t.delete(Key?.id); return {};
      case 'ScanCommand': {
        let items = [...t.values()];
        if (FilterExpression === 'id = :id') items = items.filter((i) => i.id === ExpressionAttributeValues[':id']);
        return { Items: items };
      }
      case 'QueryCommand':  return { Items: [] };
      case 'UpdateCommand': return { Attributes: {} };
      default:              return {};
    }
  }
}

export class SESClient      extends FakeClient { constructor() { super('ses'); } }
export class S3Client       extends FakeClient { constructor() { super('s3'); } }
export class DynamoDBClient extends FakeClient { constructor() { super('dynamoRaw'); } }
export class DynamoDBDocumentClient extends FakeClient {
  constructor() { super('dynamo'); }
  static from() { return new DynamoDBDocumentClient(); }
}
export async function getSignedUrl() { return 'https://example.invalid/signed'; }
