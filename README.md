# feathers-dynamodb

[![Build Status](https://travis-ci.org/afifsohaili/feathers-dynamodb.png?branch=master)](https://travis-ci.org/afifsohaili/feathers-dynamodb)
[![Code Climate](https://codeclimate.com/github/afifsohaili/feathers-dynamodb/badges/gpa.svg)](https://codeclimate.com/github/afifsohaili/feathers-dynamodb)
[![Test Coverage](https://codeclimate.com/github/afifsohaili/feathers-dynamodb/badges/coverage.svg)](https://codeclimate.com/github/afifsohaili/feathers-dynamodb/coverage)
[![Dependency Status](https://img.shields.io/david/afifsohaili/feathers-dynamodb.svg?style=flat-square)](https://david-dm.org/afifsohaili/feathers-dynamodb)
[![Download Status](https://img.shields.io/npm/dm/feathers-dynamodb.svg?style=flat-square)](https://www.npmjs.com/package/feathers-dynamodb)

> Feathers service with AWS DynamoDb

## Installation

```
npm install feathers-dynamodb --save
```

## Documentation

```js
// app.js
const feathersDynamoose = require('feathers-dynamoose');

app.use('/users', feathersDynamoose(
  options, // See below for full list of options
  optionalDynamooseOptions // See https://dynamoosejs.com/api#dynamoosemodelname-schema-options
));
```

## Options

Options is a JavaScript object with the following keys:

| Key       | Description                                                                        | Required |
|-----------|------------------------------------------------------------------------------------|----------|
| modelName | The name of the model.                                                             | ✅|
| schema    | The schema for the model. Refer to https://dynamoosejs.com/api#schema              | ✅|
| localUrl  | If the key is present, will instantiate dynamoose with `dynamoose.local(localUrl)` | |

## License

Copyright (c) 2018

Licensed under the [MIT license](LICENSE).
