module.exports = function (config) {
  config.set({
    mutator: 'javascript',
    mutate: [
      'src/**/*.js',
      '!src/**/*.spec.js',
      '!src/**/logger.js'
    ],
    packageManager: 'npm',
    reporters: ['clear-text', 'progress'],
    testRunner: 'jest',
    coverageAnalysis: 'off'
  });
};
