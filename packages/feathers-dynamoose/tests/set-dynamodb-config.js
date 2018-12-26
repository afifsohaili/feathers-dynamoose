const dynamoose = require('dynamoose');

dynamoose.AWS.config.update({
  accessKeyId: 'accessKeyId',
  secretAccessKey: 'secretAccessKey',
  region: 'us-west-2'
});
