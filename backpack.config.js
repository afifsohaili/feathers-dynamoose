module.exports = {
  webpack: config => {
    return {
      ...config,
      mode: 'development',
      output: {
        ...config.output,
        libraryTarget: 'commonjs2'
      }
    };
  }
};
