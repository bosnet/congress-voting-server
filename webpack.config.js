const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'production',
  entry: {
    login: './public/js/login.js',
  },
  output: {
    path: path.resolve(__dirname, 'public', 'dist'),
    filename: "[name].[chunkhash].js",
  },
  resolve: {
    alias: {
      jquery: "jquery/src/jquery",
    },
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          { loader: MiniCssExtractPlugin.loader, },
          "css-loader",
          "sass-loader",
        ]
      },
      {
        test: /\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader, },
          'css-loader'
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[chunkhash].css",
      chunkFilename: "[id].css"
    })
  ],
};
