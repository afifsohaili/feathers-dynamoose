# feathers-dynamoose

[![Build Status](https://travis-ci.org/afifsohaili/feathers-dynamoose.png?branch=master)](https://travis-ci.org/afifsohaili/feathers-dynamoose)
[![Code Climate](https://codeclimate.com/github/afifsohaili/feathers-dynamoose/badges/gpa.svg)](https://codeclimate.com/github/afifsohaili/feathers-dynamoose)
[![Test Coverage](https://codeclimate.com/github/afifsohaili/feathers-dynamoose/badges/coverage.svg)](https://codeclimate.com/github/afifsohaili/feathers-dynamoose/coverage)
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
| schema    | The schema for the model. Refer to https://dynamoosejs.com/api/schema/#options     | ✅|
| localUrl  | If the key is present, will instantiate dynamoose with `dynamoose.local(localUrl)` | |

## Examples

```js
// src/users/schema.js
module.exports = {
  postId: {type: String, hashKey: true},
  blogId: {type: String, rangeKey: true},
};

// src/app.js
const uuid = require('uuid/v4');
const feathersDynamoose = require('feathers-dynamoose');
const postsSchema = require('users/schema');

app.use('/v1/posts', feathersDynamoose({modelName: 'posts', schema: postsSchema}));
// POST a new record
await app.service('v1/posts').create({postId: uuid(), blogId: uuid()});
// PUT a record
await service.update(postId, {$PUT: {body: newBody}}, {query: {blogId}});
// PATCH a record - REMEMBER, PUT replaces the resource, PATCH updates the attributes
await service.patch(postId, {$PUT: {body: newBody}}, {query: {blogId}});
// DELETE a record. id accepts an object.
await app.service('v1/posts').delete({postId: postId, blogId: blogId});
// Query all records based on the given query
await app.service('v1/posts').find({postId: postId, all: 'true'});
```

Use with http libraries against feathers backend. e.g. with `axios`.
```js
await axios.patch(`https://your.backend.url/v1/posts/${postId}`, {
  $PUT: {comments: []}
}, {params: {blogId: blogId}});
```

## License

Copyright (c) 2018

Licensed under the [MIT license](LICENSE).
