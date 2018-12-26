/* globals module, global */

const DynamoDbLocal = require('dynamodb-local');

module.exports = async () => {
  const dynamoLocalPortNumber = 8000;
  global.__dynamodb__ = await DynamoDbLocal.launch(dynamoLocalPortNumber, null, [], false);
};
