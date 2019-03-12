import {Schema} from '.';

const getAttributes = schema => {
  if (schema instanceof Schema) {
    return Object.keys(schema.attributes);
  }
  return Object.keys(schema);
};

const jsonify = schema => result => {
  if (!result) {
    return;
  }
  const mapAttributeWithValues = item => {
    return getAttributes(schema).reduce((result, attribute) => {
      if (item[attribute]) {
        result[attribute] = item[attribute];
      }
      return result;
    }, {});
  };
  if (Array.isArray(result)) {
    return result.map(mapAttributeWithValues);
  }
  return mapAttributeWithValues(result);
};

export default jsonify;
