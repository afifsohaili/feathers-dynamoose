# feathers-dynamoose

[![Build Status](https://travis-ci.org/afifsohaili/feathers-dynamoose.png?branch=master)](https://travis-ci.org/afifsohaili/feathers-dynamoose)
[![Code Climate](https://codeclimate.com/github/afifsohaili/feathers-dynamoose/badges/gpa.svg)](https://codeclimate.com/github/afifsohaili/feathers-dynamoose)
[![Test Coverage](https://codeclimate.com/github/afifsohaili/feathers-dynamoose/badges/coverage.svg)](https://codeclimate.com/github/afifsohaili/feathers-dynamoose/coverage)
[![Dependency Status](https://img.shields.io/david/afifsohaili/feathers-dynamoose.svg?style=flat-square)](https://david-dm.org/afifsohaili/feathers-dynamoose)
[![Download Status](https://img.shields.io/npm/dm/feathers-dynamoose.svg?style=flat-square)](https://www.npmjs.com/package/feathers-dynamoose)

> Feathers service with AWS DynamoDb via [dynamoose](https://dynamoosejs.com/)

## Installation

```
npm install feathers-dynamoose --save
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
