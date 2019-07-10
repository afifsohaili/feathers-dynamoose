import jsonify from './jsonify';

const shouldUseQuery = (filters, {hashKey, indexKeys}) => {
  const hasGlobalIndex = Object.keys(filters)
    .filter(key => indexKeys.includes(key))
    .filter(indexKey => filters[indexKey].eq || typeof filters[indexKey] === 'string')
    .length > 0;
  const hasHashKey = (filters[hashKey] && filters[hashKey].eq) || typeof filters[hashKey] === 'string';
  return hasHashKey || hasGlobalIndex;
};

const performQuery = async (model, filters, $limit, $select, pagination) => {
  const queryOperation = model.query(filters);
  if ($limit) {
    queryOperation.limit($limit);
  } else if (pagination && pagination.max) {
    queryOperation.limit(pagination.max);
  } else {
    queryOperation.all();
  }
  if (Array.isArray($select) && $select.length > 0) {
    queryOperation.attributes($select);
  }

  return queryOperation.exec();
};

const performScan = async (model, filters, $limit, $select, pagination) => {
  const scanOperation = model.scan(filters);
  if ($limit) {
    scanOperation.limit($limit);
  } else if (pagination && pagination.max) {
    scanOperation.limit(pagination.max);
  } else {
    scanOperation.all();
  }
  if (Array.isArray($select) && $select.length > 0) {
    scanOperation.attributes($select);
  }

  return scanOperation.exec();
};

const findService = schema => (model, keys, pagination) => {
  return {
    find: async query => {
      const {$limit, $select, ...filters} = query || {};
      const jsonifyResult = result => ({...result, data: jsonify(schema)(result)});
      if (shouldUseQuery(filters, keys)) {
        const result = await performQuery(model, filters, $limit, $select, pagination);
        return jsonifyResult(result);
      }
      const result = await performScan(model, filters, $limit, $select, pagination);
      return jsonifyResult(result);
    }
  };
};

export default findService;
