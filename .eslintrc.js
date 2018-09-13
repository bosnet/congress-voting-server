module.exports = {
  extends: 'airbnb-base',
  env: {
    node: true,
    mocha: true,
  },
  plugins: [
    'mocha',
  ],
  rules: {
    'mocha/no-exclusive-tests': 'error',
  },
  "overrides": [
    {
      "files": ["*.test.js"],
      "rules": {
        "no-unused-expressions": "off"
      }
    }
  ]
};