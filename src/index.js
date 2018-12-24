/* eslint-disable no-unused-vars */
import dynamoose from 'dynamoose';

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
    const {modelName, schema} = options;
    this.model = dynamoose.model(modelName, schema, dynamooseOptions);
  }

  async find(params) {
    return [];
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

    const Model = this.model;

    new Model(data).save();

    return data;
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
