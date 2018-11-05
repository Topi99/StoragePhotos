const path = require('path');

module.exports = {
  entry: './src/js/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'www')
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        {
          loader: "style-loader"
        }, // creates style nodes from JS strings
        {
          loader: "css-loader"
        }, // translates CSS into CommonJS
        {
          loader: "sass-loader",
          options: {
            "includePaths": [
              path.resolve(__dirname, 'node_modules')
            ]
          }
        } // compiles Sass to CSS, using Node Sass by default
      ]
    }]
  },
};