/* eslint-disable no-unused-vars */
import dynamoose from 'dynamoose';
import uuid from './uuid';

const DEFAULT_DYNAMOOSE_OPTIONS = {
  create: false,
  update: false,
  waitForActive: false,
  streamOptions: {
    enable: false
  },
  serverSideEncryption: false
};

class Service {
  constructor(options, dynamooseOptions = DEFAULT_DYNAMOOSE_OPTIONS) {
    this.options = options || {};
    if (options.localUrl) {
      dynamoose.local(options.localUrl);
    }
    const {modelName, schema} = options;
    this.model = dynamoose.model(modelName, schema, dynamooseOptions);
  }

  async find(params) {
    const Model = this.model;
    return Model.scan().exec();
  }

  async get(id, params) {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  async create(data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }
    return this.model.create({id: uuid(), ...data});
  }

  async update(id, data, params) {
    return data;
  }

  async patch(id, data, params) {
    return data;
  }

  async remove(id, params) {
    return {id};
  }
}

module.exports = options => new Service(options);
module.exports.Service = Service;
module.exports.DEFAULT_DYNAMOOSE_OPTIONS = DEFAULT_DYNAMOOSE_OPTIONS;
