var webpack = require('webpack');

var production = process.argv.indexOf('-p') > 0;
var min = production ? '.min' : '';

var config = {
  entry: {'elegant-api': './src/index.jsx'},

  devtool: production ? null : 'source-map',

  output: {
    filename: '[name]' + min + '.js',
    path: './dist/',
    library: 'elegantApi',
    libraryTarget: 'umd'
  },

  resolve: {
    extensions: ['.jsx', '.js', '.json', '']
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        CI: JSON.stringify(!!process.env.CI),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      }
    })
  ],

  module: {
    loaders: [
      { test: /\.jsx$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};


module.exports = config;
