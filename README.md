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

TBD

## Complete Example

Here's an example of a Feathers server that uses `feathers-dynamodb`. 

```js
const feathers = require('@feathersjs/feathers');
const plugin = require('feathers-dynamodb');

// Initialize the application
const app = feathers();

// Initialize the plugin
app.configure(plugin());
```

## License

Copyright (c) 2018

Licensed under the [MIT license](LICENSE).
