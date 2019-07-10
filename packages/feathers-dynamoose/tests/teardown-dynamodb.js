/* globals module, global */

const DynamoDbLocal = require('dynamodb-local');

module.exports = async () => {
  await DynamoDbLocal.stopChild(global.__dynamodb__);
  console.log('Stopped DynamoDB');
};
