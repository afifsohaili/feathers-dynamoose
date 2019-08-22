/* globals module, global */

const DynamoDbLocal = require('dynamodb-local');

DynamoDbLocal.configureInstaller({
  installPath: './dynamodblocal-bin',
  downloadUrl: 'https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.tar.gz'
});

module.exports = async () => {
  const dynamoLocalPortNumber = 15551;
  global.__dynamodb__ = await DynamoDbLocal.launch(dynamoLocalPortNumber, null, [], false);
  console.log('Launched DynamoDB');
};
