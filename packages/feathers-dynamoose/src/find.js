import jsonify from './jsonify';

const shouldUseQuery = (filters, {hashKey, indexKeys}) => {
  const hasGlobalIndex = Object.keys(filters)
    .filter(key => indexKeys.includes(key))
    .filter(indexKey => filters[indexKey].eq || typeof filters[indexKey] === 'string')
    .length > 0;
  const hasHashKey = (filters[hashKey] && filters[hashKey].eq) || typeof filters[hashKey] === 'string';
  return hasHashKey || hasGlobalIndex;
};

const applyFilters = (operation, filters, keys) => {
  const allKeys = Object.values(keys).reduce((acc, key) => {
    if (Array.isArray(key)) {
      return [...acc, ...key];
    }
    return [...acc, key];
  }, []);
  Object.entries(filters).forEach(([filterKey, value]) => {
    if (allKeys.includes(filterKey)) {
      return;
    }
    operation.filter(filterKey).eq(value);
  });
  return operation;
};

const applySelectAttributes = (operation, $select) => {
  if (Array.isArray($select) && $select.length > 0) {
    operation.attributes($select);
  }
  return operation;
};

const applyLimits = (operation, $limit, pagination) => {
  if ($limit) {
    operation.limit($limit);
  } else if (pagination && pagination.max) {
    operation.limit(pagination.max);
  } else {
    operation.all();
  }
};

const jsonifyResult = schema => result => {
  const {scannedCount, count, timesScanned} = result;
  return {scannedCount, count, timesScanned, data: jsonify(schema)(result)};
};

const findService = schema => (model, keys, pagination) => {
  const jsonifyResultBasedOnSchema = jsonifyResult(schema);

  return {
    find: async query => {
      const {$limit, $select, ...queries} = query || {};
      let operation;
      if (shouldUseQuery(queries, keys)) {
        operation = model.query(queries);
      } else {
        operation = model.scan(queries);
      }
      applyFilters(operation, queries, keys);
      applySelectAttributes(operation, $select);
      applyLimits(operation, $limit, pagination);
      const result = await operation.exec();
      return jsonifyResultBasedOnSchema(result);
    }
  };
};

export default findService;
